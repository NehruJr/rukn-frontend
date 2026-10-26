/**
 * Milestone 1 Adversarial Challenger 2 Stress Test Suite
 * Frontend Platform Auth Concurrency, Token Expiry, Route Guards & Cross-Plane Isolation
 */

import { test, describe, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';
import axios from 'axios';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

// Polyfill browser globals for node testing
const storageMap = new Map();
globalThis.localStorage = {
  getItem: (k) => storageMap.get(k) || null,
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};

let currentPath = '/platform/dashboard';
globalThis.window = {
  location: {
    get pathname() { return currentPath; },
    set pathname(val) { currentPath = val; },
    get href() { return currentPath; },
    set href(val) { currentPath = val; }
  }
};

let platformApi;
let usePlatformAuthStore;
let useAuthStore;
let PlatformProtectedRoute;
let __setMockProtectedRouteState;

describe('Adversarial Challenger M1.2: Frontend Platform Concurrency & Routing Harness', () => {

  before(async () => {
    // 1. Bundle Services & Stores
    const servicesBundle = await esbuild.build({
      stdin: {
        contents: `
          export { default as platformApi } from './src/services/platformApi.js';
          export { usePlatformAuthStore } from './src/store/platformAuthStore.js';
          export { useAuthStore } from './src/store/authStore.js';
        `,
        resolveDir: process.cwd(),
        loader: 'js',
      },
      bundle: true,
      platform: 'node',
      format: 'esm',
      define: {
        'import.meta.env.VITE_API_URL': '"/api/v1"',
        'import.meta.env': '{}'
      },
      external: ['zustand', 'zustand/middleware', 'axios'],
      write: false,
      alias: { '@': './src' }
    });

    const tmpServices = path.resolve('./node_modules/.tmp_test_services.mjs');
    fs.writeFileSync(tmpServices, servicesBundle.outputFiles[0].text);
    const servicesMod = await import(tmpServices);
    fs.unlinkSync(tmpServices);

    platformApi = servicesMod.platformApi;
    usePlatformAuthStore = servicesMod.usePlatformAuthStore;
    useAuthStore = servicesMod.useAuthStore;

    // 2. Bundle PlatformProtectedRoute with mocked store for SSR-safe hook execution
    const guardBundle = await esbuild.build({
      stdin: {
        contents: `
          export { default as PlatformProtectedRoute } from './src/components/platform/PlatformProtectedRoute.jsx';
          export { __setMockProtectedRouteState } from './mock-store-module.js';
        `,
        resolveDir: process.cwd(),
        loader: 'jsx',
      },
      bundle: true,
      platform: 'node',
      format: 'esm',
      jsx: 'automatic',
      define: { 'import.meta.env': '{}' },
      external: ['react', 'react-router-dom'],
      plugins: [{
        name: 'store-mock',
        setup(build) {
          build.onResolve({ filter: /platformAuthStore|mock-store-module/ }, () => ({
            path: 'mock-store',
            namespace: 'mock-store'
          }));
          build.onLoad({ filter: /.*/, namespace: 'mock-store' }, () => ({
            contents: `
              let current = { isPlatformAuthenticated: false, role: null };
              export const __setMockProtectedRouteState = (s) => { current = s; };
              export const usePlatformAuthStore = () => current;
              export default usePlatformAuthStore;
            `,
            loader: 'js'
          }));
        }
      }],
      write: false,
      alias: { '@': './src' }
    });

    const tmpGuard = path.resolve('./node_modules/.tmp_test_guard.mjs');
    fs.writeFileSync(tmpGuard, guardBundle.outputFiles[0].text);
    const guardMod = await import(tmpGuard);
    fs.unlinkSync(tmpGuard);

    PlatformProtectedRoute = guardMod.PlatformProtectedRoute;
    __setMockProtectedRouteState = guardMod.__setMockProtectedRouteState;
  });

  beforeEach(async () => {
    storageMap.clear();
    currentPath = '/platform/dashboard';
    if (usePlatformAuthStore?.getState()?.logout) {
      await usePlatformAuthStore.getState().logout();
    }
    if (useAuthStore?.getState()?.logout) {
      useAuthStore.getState().logout();
    }
    __setMockProtectedRouteState({ isPlatformAuthenticated: false, role: null });
  });

  // ==========================================================================
  // Section 1: Platform Auth Store State & Role Logic
  // ==========================================================================
  describe('1. Platform Auth Store & RBAC Logic Stress Tests', () => {

    test('1.1 Store initializes with unauthenticated state', () => {
      const state = usePlatformAuthStore.getState();
      assert.strictEqual(state.isPlatformAuthenticated, false);
      assert.strictEqual(state.platformUser, null);
      assert.strictEqual(state.platformToken, null);
      assert.strictEqual(state.platformRefreshToken, null);
      assert.strictEqual(state.role, null);
    });

    test('1.2 setAuth stores tokens and persists strictly under platform-auth-storage', () => {
      usePlatformAuthStore.getState().setAuth({
        user: { id: 'p_123', email: 'owner@rukn.test', role: 'owner' },
        token: 'token_owner_abc',
        refreshToken: 'refresh_owner_xyz'
      });

      const state = usePlatformAuthStore.getState();
      assert.strictEqual(state.isPlatformAuthenticated, true);
      assert.strictEqual(state.role, 'owner');
      assert.strictEqual(state.platformToken, 'token_owner_abc');
      assert.strictEqual(state.platformRefreshToken, 'refresh_owner_xyz');

      // Verify localStorage persistence key
      const persistedStr = storageMap.get('platform-auth-storage');
      assert.ok(persistedStr, 'localStorage must contain platform-auth-storage');
      const persisted = JSON.parse(persistedStr);
      assert.strictEqual(persisted.state.platformToken, 'token_owner_abc');
      assert.strictEqual(persisted.state.role, 'owner');

      // Verify tenant auth-storage does NOT store platform credentials
      const tenantPersistedStr = storageMap.get('auth-storage');
      if (tenantPersistedStr) {
        const tenantPersisted = JSON.parse(tenantPersistedStr);
        assert.notStrictEqual(tenantPersisted.state.token, 'token_owner_abc', 'Platform token must not leak to auth-storage');
        assert.strictEqual(tenantPersisted.state.isAuthenticated, false);
      }
    });

    test('1.3 hasRole logic: owner has all roles, admin/support strictly partitioned', () => {
      const store = usePlatformAuthStore.getState();

      // Unauthenticated
      assert.strictEqual(store.hasRole('owner'), false);
      assert.strictEqual(store.hasRole('admin'), false);
      assert.strictEqual(store.hasRole('support'), false);

      // Support role
      store.setAuth({
        user: { id: 'p_sup', email: 'sup@rukn.test', role: 'support' },
        token: 't_sup',
        refreshToken: 'r_sup'
      });
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('support'), true);
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('admin'), false);
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('owner'), false);
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('admin', 'owner'), false);
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('support', 'admin'), true);

      // Admin role
      usePlatformAuthStore.getState().setAuth({
        user: { id: 'p_adm', email: 'adm@rukn.test', role: 'admin' },
        token: 't_adm',
        refreshToken: 'r_adm'
      });
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('admin'), true);
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('support'), false);
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('owner'), false);

      // Owner role: Superuser access across all roles
      usePlatformAuthStore.getState().setAuth({
        user: { id: 'p_own', email: 'own@rukn.test', role: 'owner' },
        token: 't_own',
        refreshToken: 'r_own'
      });
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('owner'), true);
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('admin'), true);
      assert.strictEqual(usePlatformAuthStore.getState().hasRole('support'), true);
    });

    test('1.4 Cross-Plane Isolation: Platform logout does NOT destroy tenant CRM session', async () => {
      // Simulate tenant user logged in
      useAuthStore.getState().setAuth({
        user: { id: 'tenant_user_1', role: 'agent', organization: 'org_1' },
        token: 'tenant_jwt_token_123',
        refreshToken: 'tenant_refresh_123'
      });

      // Platform user logged in
      usePlatformAuthStore.getState().setAuth({
        user: { id: 'staff_1', role: 'admin' },
        token: 'platform_jwt_staff',
        refreshToken: 'platform_refresh_staff'
      });

      assert.strictEqual(useAuthStore.getState().isAuthenticated, true);
      assert.strictEqual(usePlatformAuthStore.getState().isPlatformAuthenticated, true);

      // Log out platform staff
      await usePlatformAuthStore.getState().logout();

      assert.strictEqual(usePlatformAuthStore.getState().isPlatformAuthenticated, false);
      assert.strictEqual(usePlatformAuthStore.getState().platformToken, null);

      // Tenant CRM session MUST remain 100% intact
      assert.strictEqual(useAuthStore.getState().isAuthenticated, true);
      assert.strictEqual(useAuthStore.getState().token, 'tenant_jwt_token_123');
      assert.strictEqual(useAuthStore.getState().user.id, 'tenant_user_1');
    });
  });

  // ==========================================================================
  // Section 2: platformApi Concurrency & Silent Refresh Queue Stress Tests
  // ==========================================================================
  describe('2. platformApi Concurrency & Refresh Queue Stress Tests', () => {

    test('2.1 Request Interceptor attaches Bearer platformToken from store', async () => {
      usePlatformAuthStore.getState().setAuth({
        user: { email: 'staff@rukn.test', role: 'admin' },
        token: 'bearer_test_token_111',
        refreshToken: 'r_111'
      });

      let capturedAuthHeader = null;
      platformApi.defaults.adapter = async (config) => {
        capturedAuthHeader = config.headers?.Authorization;
        return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
      };

      await platformApi.get('/test-endpoint');
      assert.strictEqual(capturedAuthHeader, 'Bearer bearer_test_token_111');
    });

    test('2.2 Concurrency Stress: 10 Simultaneous 401s trigger EXACTLY ONE refresh call, all replay cleanly', async () => {
      usePlatformAuthStore.getState().setAuth({
        user: { email: 'staff@rukn.test', role: 'admin' },
        token: 'initial-expired-token',
        refreshToken: 'valid-refresh-token'
      });

      let refreshInvocations = 0;
      const originalAxiosPost = axios.post;

      // Mock refresh endpoint with artificial latency (50ms) to force concurrency queuing
      axios.post = async (url, data) => {
        if (url.includes('/auth/refresh')) {
          refreshInvocations++;
          await new Promise((r) => setTimeout(r, 50));
          return {
            data: {
              token: 'new-rotated-token-999',
              refreshToken: 'new-rotated-refresh-999',
              staffUser: { email: 'staff@rukn.test', role: 'admin' }
            }
          };
        }
        return originalAxiosPost(url, data);
      };

      let initial401Count = 0;
      let replayed200Count = 0;

      platformApi.defaults.adapter = async (config) => {
        const auth = config.headers?.Authorization;
        if (auth === 'Bearer initial-expired-token') {
          initial401Count++;
          const err = new Error('Request failed with status code 401');
          err.response = { status: 401, data: { code: 'TOKEN_EXPIRED' }, config };
          err.config = config;
          throw err;
        }

        if (auth === 'Bearer new-rotated-token-999') {
          replayed200Count++;
          return {
            data: { success: true, url: config.url, tokenUsed: auth },
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          };
        }

        throw new Error(`Unexpected Authorization header: ${auth}`);
      };

      try {
        // Fire 10 simultaneous requests
        const requests = Array.from({ length: 10 }, (_, i) => platformApi.get(`/concurrent/${i}`));
        const responses = await Promise.all(requests);

        assert.strictEqual(responses.length, 10, 'All 10 requests must complete');
        assert.strictEqual(refreshInvocations, 1, 'Refresh endpoint must be called EXACTLY ONCE');
        assert.strictEqual(initial401Count, 10, 'All 10 requests initially received 401');
        assert.strictEqual(replayed200Count, 10, 'All 10 requests were replayed with new token');

        for (let i = 0; i < 10; i++) {
          assert.strictEqual(responses[i].data.success, true);
          assert.strictEqual(responses[i].data.tokenUsed, 'Bearer new-rotated-token-999');
          assert.strictEqual(responses[i].data.url, `/concurrent/${i}`);
        }

        // Verify store was updated with new token
        assert.strictEqual(usePlatformAuthStore.getState().platformToken, 'new-rotated-token-999');
      } finally {
        axios.post = originalAxiosPost;
      }
    });

    test('2.3 Refresh Failure Stress: When refresh token fails, all 10 queued requests reject and user is logged out', async () => {
      usePlatformAuthStore.getState().setAuth({
        user: { email: 'staff@rukn.test', role: 'admin' },
        token: 'initial-expired-token',
        refreshToken: 'revoked-or-expired-refresh-token'
      });

      let refreshInvocations = 0;
      const originalAxiosPost = axios.post;

      axios.post = async (url, data) => {
        if (url.includes('/auth/refresh')) {
          refreshInvocations++;
          await new Promise((r) => setTimeout(r, 40));
          const err = new Error('Refresh token revoked');
          err.response = { status: 401, data: { code: 'REVOKED_REFRESH_TOKEN' } };
          throw err;
        }
        return originalAxiosPost(url, data);
      };

      platformApi.defaults.adapter = async (config) => {
        const err = new Error('Unauthorized');
        err.response = { status: 401, data: { code: 'TOKEN_EXPIRED' }, config };
        err.config = config;
        throw err;
      };

      try {
        const requests = Array.from({ length: 10 }, (_, i) => platformApi.get(`/resource/${i}`));
        const results = await Promise.allSettled(requests);

        assert.strictEqual(results.length, 10);
        assert.strictEqual(refreshInvocations, 1, 'Only one refresh attempt must be made');

        // All 10 requests must be rejected
        for (const res of results) {
          assert.strictEqual(res.status, 'rejected');
          assert.strictEqual(res.reason.message, 'Refresh token revoked');
        }

        // Store must be completely wiped
        assert.strictEqual(usePlatformAuthStore.getState().isPlatformAuthenticated, false);
        assert.strictEqual(usePlatformAuthStore.getState().platformToken, null);
        assert.strictEqual(usePlatformAuthStore.getState().platformRefreshToken, null);

        // Redirected to login
        assert.strictEqual(currentPath, '/platform/login');
      } finally {
        axios.post = originalAxiosPost;
      }
    });

    test('2.4 Missing Refresh Token: Immediately aborts, logs out, and rejects all without calling refresh API', async () => {
      usePlatformAuthStore.getState().setAuth({
        user: { email: 'staff@rukn.test', role: 'support' },
        token: 'token-without-refresh',
        refreshToken: null // Missing refresh token
      });

      let refreshCalled = false;
      const originalAxiosPost = axios.post;
      axios.post = async (url, data) => {
        if (url.includes('/auth/refresh')) {
          refreshCalled = true;
        }
        return originalAxiosPost(url, data);
      };

      platformApi.defaults.adapter = async (config) => {
        const err = new Error('Unauthorized');
        err.response = { status: 401, data: { code: 'TOKEN_EXPIRED' }, config };
        err.config = config;
        throw err;
      };

      try {
        await assert.rejects(async () => {
          await platformApi.get('/some-data');
        });

        assert.strictEqual(refreshCalled, false, 'Should NOT call /auth/refresh when refreshToken is missing');
        assert.strictEqual(usePlatformAuthStore.getState().isPlatformAuthenticated, false);
        assert.strictEqual(currentPath, '/platform/login');
      } finally {
        axios.post = originalAxiosPost;
      }
    });

    test('2.5 Auth Endpoint Exclusion: 401 on /auth/login or /auth/refresh rejects immediately without queueing or refresh loops', async () => {
      usePlatformAuthStore.getState().setAuth({
        user: { email: 'staff@rukn.test', role: 'support' },
        token: 'existing-token',
        refreshToken: 'existing-refresh'
      });

      let refreshCalled = false;
      const originalAxiosPost = axios.post;
      axios.post = async (url, data) => {
        if (url.includes('/auth/refresh')) {
          refreshCalled = true;
        }
        return originalAxiosPost(url, data);
      };

      platformApi.defaults.adapter = async (config) => {
        const err = new Error('Invalid credentials');
        err.response = { status: 401, data: { code: 'INVALID_CREDENTIALS' }, config };
        err.config = config;
        throw err;
      };

      try {
        await assert.rejects(async () => {
          await platformApi.post('/auth/login', { email: 'test@rukn.test', password: 'bad' });
        });

        assert.strictEqual(refreshCalled, false, 'Auth endpoint failure must NOT trigger silent refresh loop');
      } finally {
        axios.post = originalAxiosPost;
      }
    });

    test('2.6 Non-401 Error Pass-Through: 400, 403, 404, 500 pass through directly without refresh', async () => {
      usePlatformAuthStore.getState().setAuth({
        user: { email: 'staff@rukn.test', role: 'support' },
        token: 'valid-token',
        refreshToken: 'valid-refresh'
      });

      let refreshCalled = false;
      const originalAxiosPost = axios.post;
      axios.post = async (url, data) => {
        if (url.includes('/auth/refresh')) refreshCalled = true;
        return originalAxiosPost(url, data);
      };

      const errorStatuses = [400, 403, 404, 422, 500];

      try {
        for (const status of errorStatuses) {
          platformApi.defaults.adapter = async (config) => {
            const err = new Error(`Error ${status}`);
            err.response = { status, data: { code: `STATUS_${status}` }, config };
            err.config = config;
            throw err;
          };

          await assert.rejects(
            async () => { await platformApi.get(`/error-test-${status}`); },
            (err) => err.response?.status === status
          );
        }

        assert.strictEqual(refreshCalled, false, 'Non-401 errors must never trigger silent refresh');
      } finally {
        axios.post = originalAxiosPost;
      }
    });
  });

  // ==========================================================================
  // Section 3: Platform Protected Route Guard & Role Access Matrix
  // ==========================================================================
  describe('3. PlatformProtectedRoute & Role Access Matrix Stress Tests', () => {

    test('3.1 Unauthenticated access renders Navigate to /platform/login', () => {
      __setMockProtectedRouteState({ isPlatformAuthenticated: false, role: null });

      const mockChild = React.createElement('div', { id: 'child-content' }, 'Platform Content');
      const routeElement = React.createElement(
        MemoryRouter,
        { initialEntries: ['/platform/dashboard'] },
        React.createElement(PlatformProtectedRoute, {}, mockChild)
      );
      const html = renderToStaticMarkup(routeElement);

      assert.strictEqual(html.includes('id="child-content"'), false, 'Unauthenticated user must not see protected content');
    });

    test('3.2 Authenticated user with matching allowedRoles renders child content', () => {
      __setMockProtectedRouteState({ isPlatformAuthenticated: true, role: 'admin' });

      const mockChild = React.createElement('div', { id: 'admin-content' }, 'Admin Panel');
      const routeElement = React.createElement(
        MemoryRouter,
        { initialEntries: ['/platform/staff'] },
        React.createElement(
          PlatformProtectedRoute,
          { allowedRoles: ['admin', 'owner'] },
          mockChild
        )
      );
      const html = renderToStaticMarkup(routeElement);

      assert.ok(html.includes('id="admin-content"'), 'Admin user should see content guarded with allowedRoles: [admin, owner]');
    });

    test('3.3 Authenticated support role blocked on owner-only route', () => {
      __setMockProtectedRouteState({ isPlatformAuthenticated: true, role: 'support' });

      const mockChild = React.createElement('div', { id: 'owner-content' }, 'Owner Secret Panel');
      const routeElement = React.createElement(
        MemoryRouter,
        { initialEntries: ['/platform/owner-zone'] },
        React.createElement(
          PlatformProtectedRoute,
          { allowedRoles: ['owner'] },
          mockChild
        )
      );
      const html = renderToStaticMarkup(routeElement);

      assert.strictEqual(html.includes('id="owner-content"'), false, 'Support user must not see owner-only content');
    });

    test('3.4 Owner role passes all allowedRoles combinations (superuser)', () => {
      __setMockProtectedRouteState({ isPlatformAuthenticated: true, role: 'owner' });

      const combinations = [
        ['owner'],
        ['admin'],
        ['support'],
        ['admin', 'support']
      ];

      for (const roles of combinations) {
        const mockChild = React.createElement('div', { id: `owner-pass-${roles.join('-')}` }, 'Access Granted');
        const routeElement = React.createElement(
          MemoryRouter,
          { initialEntries: ['/platform/any'] },
          React.createElement(
            PlatformProtectedRoute,
            { allowedRoles: roles },
            mockChild
          )
        );
        const html = renderToStaticMarkup(routeElement);
        assert.ok(html.includes('Access Granted'), `Owner must be granted access for allowedRoles: [${roles.join(', ')}]`);
      }
    });
  });

  // ==========================================================================
  // Section 4: Routing Architecture Audit for /platform/staff & Owner Actions
  // ==========================================================================
  describe('4. Routing Architecture & Staff UI Action Gating Audit', () => {

    test('4.1 App.jsx route inspection: /platform/staff is NOT wrapped with allowedRoles guard', () => {
      const appJsxPath = path.resolve('./src/App.jsx');
      const appContent = fs.readFileSync(appJsxPath, 'utf8');

      // Check if <Route path="staff" ...> has role protection
      const staffRouteMatch = /<Route\s+path=["']staff["']\s+element=\{([^}]+)\}\s*\/>/.exec(appContent);
      assert.ok(staffRouteMatch, 'App.jsx must declare <Route path="staff" ...>');

      const elementValue = staffRouteMatch[1].trim();
      const isWrappedWithGuard = elementValue.includes('PlatformProtectedRoute') && elementValue.includes('allowedRoles');

      // Document empirical finding: Route is unprotected on client routing level
      // It renders <PlatformStaff /> directly rather than <PlatformProtectedRoute allowedRoles={...}><PlatformStaff /></PlatformProtectedRoute>
      assert.strictEqual(
        isWrappedWithGuard,
        false,
        'Finding confirmed: App.jsx does not guard /platform/staff with allowedRoles at the route level'
      );
    });

    test('4.2 PlatformSidebar.jsx nav inspection: Staff link is displayed to all roles', () => {
      const sidebarPath = path.resolve('./src/components/platform/PlatformSidebar.jsx');
      const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

      // Inspect navItems declaration
      assert.ok(sidebarContent.includes("path: '/platform/staff'"));
      // Check if navItems filtering excludes support
      assert.strictEqual(
        sidebarContent.includes('filter('),
        false,
        'Finding confirmed: PlatformSidebar.jsx does not filter navItems based on user role'
      );
    });

    test('4.3 PlatformStaff.jsx UI Action Gating: Owner-only buttons strictly check isOwner', () => {
      const staffPagePath = path.resolve('./src/pages/platform/PlatformStaff.jsx');
      const staffPageContent = fs.readFileSync(staffPagePath, 'utf8');

      // Verify isOwner logic
      assert.ok(staffPageContent.includes("hasRole('owner')"), 'PlatformStaff must calculate isOwner via hasRole("owner")');
      assert.ok(staffPageContent.includes('{isOwner && ('), 'Add staff button must be conditionally rendered on isOwner');
      assert.ok(staffPageContent.includes('handleToggleStatus'), 'Status toggles exist');
      assert.ok(staffPageContent.includes('handleDeleteStaff'), 'Delete actions exist');

      // Verify error banner is present when getStaffList fails (e.g. 403 on support role)
      assert.ok(staffPageContent.includes('errorBanner'), 'Error banner must be rendered when backend returns 403');
    });
  });
});
