/**
 * Empirical Stress Test Harness for Milestone 3 (QR Code & Print Layout)
 * Challenger M3.2
 */

import assert from 'node:assert';
import test, { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import esbuild from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { generateQRCodeSVG, QRCodeSVG } from '../src/utils/qrSvg.js';

// ============================================================================
// 1. QR Code Engine (qrSvg.js) Empirical Stress Tests
// ============================================================================
describe('1. QR Code Engine (qrSvg.js) Empirical Stress Tests', () => {

  it('1.1 Zero External Dependencies Audit', () => {
    const qrSvgPath = path.resolve('./src/utils/qrSvg.js');
    const qrCodePath = path.resolve('./src/utils/qrCode.js');
    const svgCode = fs.readFileSync(qrSvgPath, 'utf8');
    const codeCode = fs.readFileSync(qrCodePath, 'utf8');

    // Extract all imports
    const importRegex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(svgCode)) !== null) {
      imports.push(match[1]);
    }
    // Only 'react' should be imported
    for (const imp of imports) {
      assert.strictEqual(imp, 'react', `Unexpected import in qrSvg.js: ${imp}`);
    }

    // Check qrCode.js
    const qrCodeImports = [];
    while ((match = importRegex.exec(codeCode)) !== null) {
      qrCodeImports.push(match[1]);
    }
    // qrCode only re-exports from ./qrSvg
    assert.deepStrictEqual(qrCodeImports, [], 'qrCode.js should only export from ./qrSvg');
  });

  it('1.2 Empty and Falsy Input Handling', () => {
    for (const val of ['', null, undefined]) {
      const res = generateQRCodeSVG(val);
      assert.strictEqual(res.svg, '', 'SVG should be empty for falsy input');
      assert.strictEqual(res.pathData, '', 'pathData should be empty for falsy input');
      assert.strictEqual(res.totalModules, 0, 'totalModules should be 0');
    }
  });

  it('1.3 Short, Medium, Long, and Complex Query URLs', () => {
    const testCases = [
      { name: 'Short URL', url: 'https://r.co/x', expectedMaxVersion: 2 },
      { name: 'Standard Tour URL', url: 'https://crm.rukn.com/tour/670f5e1f9a2b3c4d5e6f7a8b', expectedMaxVersion: 5 },
      { name: 'Standard Share URL', url: 'https://crm.rukn.com/share/670f5e1f9a2b3c4d5e6f7a8b', expectedMaxVersion: 5 },
      {
        name: 'Long URL with Multi-Query Parameters',
        url: 'https://crm.ruknrealestate.com/share/670f5e1f9a2b3c4d5e6f7a8b?source=whatsapp&campaign=october_promo&agent=karim_elmasry&branch=cairo_main&utm_medium=pdf_qr&utm_content=luxury_duplex_tagamoa',
        expectedMaxVersion: 10
      },
      {
        name: 'URL with Special URL Delimiters',
        url: 'https://crm.rukn.com/share/prop?id=123&token=abc-XYZ_09~%20#section:gallery',
        expectedMaxVersion: 7
      },
      {
        name: 'URL with Arabic UTF-8 Query Parameters',
        url: 'https://crm.rukn.com/share/prop?city=القاهرة&compound=التجمع_الخامس&ref=ركن_123',
        expectedMaxVersion: 10
      },
      {
        name: 'Very Long URL Exceeding Typical Brokerage Lengths (250+ chars)',
        url: 'https://crm.rukn.com/tour/670f5e1f9a2b3c4d5e6f7a8b?' + 'param='.repeat(40),
        expectedMaxVersion: 10
      }
    ];

    for (const tc of testCases) {
      const res = generateQRCodeSVG(tc.url);

      assert.ok(res.svg, `${tc.name}: SVG should not be empty`);
      assert.ok(res.pathData, `${tc.name}: pathData should not be empty`);
      assert.ok(res.version <= tc.expectedMaxVersion, `${tc.name}: Version ${res.version} exceeds expected max ${tc.expectedMaxVersion}`);
      assert.ok(res.gridSize >= 21, `${tc.name}: Grid size should be at least 21`);

      // Strict validation: NO NaN, NO undefined, NO null
      assert.ok(!res.svg.includes('NaN'), `${tc.name}: SVG contains NaN!`);
      assert.ok(!res.svg.includes('undefined'), `${tc.name}: SVG contains undefined!`);
      assert.ok(!res.svg.includes('null'), `${tc.name}: SVG contains null!`);
      assert.ok(!res.pathData.includes('NaN'), `${tc.name}: pathData contains NaN!`);
      assert.ok(!res.pathData.includes('undefined'), `${tc.name}: pathData contains undefined!`);

      // Structure check
      assert.ok(res.svg.startsWith('<svg '), `${tc.name}: SVG must start with <svg `);
      assert.ok(res.svg.endsWith('</svg>'), `${tc.name}: SVG must end with </svg>`);
      assert.ok(res.svg.includes(`viewBox="0 0 ${res.totalModules} ${res.totalModules}"`), `${tc.name}: viewBox mismatch`);
      assert.ok(res.svg.includes('shape-rendering="crispEdges"'), `${tc.name}: crispEdges missing`);
    }
  });

  it('1.4 Path Data Coordinate Integrity and Geometry Bounds', () => {
    const urls = [
      'https://r.co/1',
      'https://crm.rukn.com/tour/token_abc',
      'https://crm.rukn.com/share/very_long_url_with_parameters_and_tracking_tokens_1234567890'
    ];

    for (const url of urls) {
      const margin = 2;
      const res = generateQRCodeSVG(url, { margin });
      const pathParts = res.pathData.split(' ').filter(Boolean);

      assert.ok(pathParts.length > 50, 'Path parts should have modules');

      const coordRegex = /^M(\d+),(\d+)h1v1h-1z$/;
      const seen = new Set();

      for (const p of pathParts) {
        const m = coordRegex.exec(p);
        assert.ok(m, `Invalid path instruction: "${p}"`);

        const x = parseInt(m[1], 10);
        const y = parseInt(m[2], 10);

        // Coordinates must be strictly within [margin, gridSize + margin - 1]
        assert.ok(x >= margin, `x coordinate ${x} < margin ${margin}`);
        assert.ok(x < res.gridSize + margin, `x coordinate ${x} >= max ${res.gridSize + margin}`);
        assert.ok(y >= margin, `y coordinate ${y} < margin ${margin}`);
        assert.ok(y < res.gridSize + margin, `y coordinate ${y} >= max ${res.gridSize + margin}`);

        const key = `${x},${y}`;
        assert.ok(!seen.has(key), `Duplicate module at ${key}`);
        seen.add(key);
      }
    }
  });

  it('1.5 Finder Patterns Validation Across All Supported Versions (v1..v10)', () => {
    const EXPECTED_FINDER = [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1]
    ];

    // Representative inputs that trigger versions 1 through 10
    const inputsByVersion = [
      '1', // v1 (size 21)
      '12345678901234567', // v2 (size 25)
      'https://crm.rukn.com/v3', // v3 (size 29)
      'https://crm.rukn.com/tour/v4_longer_payload', // v4 (size 33)
      'https://crm.rukn.com/share/v5_payload_with_several_parameters_here', // v5 (size 37)
      'https://crm.rukn.com/share/v6_payload_exceeding_eighty_six_bytes_safely_now_1234567890', // v6 (size 41)
      'https://crm.rukn.com/share/v7_payload_exceeding_one_hundred_and_eight_bytes_safely_testing_boundaries_123456789', // v7 (size 45)
      'https://crm.rukn.com/share/v8_payload_exceeding_one_hundred_twenty_four_bytes_safely_testing_boundaries_with_additional_padding_now_123456789', // v8 (size 49)
      'https://crm.rukn.com/share/v9_payload_exceeding_one_hundred_fifty_four_bytes_safely_testing_boundaries_with_additional_query_params_and_tracking_utm_sources_1234567890', // v9 (size 53)
      'https://crm.rukn.com/share/v10_payload_exceeding_one_hundred_eighty_two_bytes_safely_testing_boundaries_with_very_long_url_tokens_and_campaign_tracking_metrics_for_maximum_capacity_test_12345' // v10 (size 57)
    ];

    for (const [idx, inp] of inputsByVersion.entries()) {
      const margin = 2;
      const res = generateQRCodeSVG(inp, { margin });
      const size = res.gridSize;

      // Reconstruct grid
      const grid = Array.from({ length: size }, () => new Array(size).fill(0));
      const regex = /M(\d+),(\d+)h1v1h-1z/g;
      let match;
      while ((match = regex.exec(res.pathData)) !== null) {
        const x = parseInt(match[1], 10) - margin;
        const y = parseInt(match[2], 10) - margin;
        grid[y][x] = 1;
      }

      // Check Finder at (0, 0)
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          assert.strictEqual(grid[r][c], EXPECTED_FINDER[r][c], `Top-Left Finder mismatch at (${r},${c}) for input #${idx + 1}`);
        }
      }

      // Check Finder at (0, size - 7)
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          assert.strictEqual(grid[r][size - 7 + c], EXPECTED_FINDER[r][c], `Top-Right Finder mismatch at (${r},${c}) for input #${idx + 1}`);
        }
      }

      // Check Finder at (size - 7, 0)
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          assert.strictEqual(grid[size - 7 + r][c], EXPECTED_FINDER[r][c], `Bottom-Left Finder mismatch at (${r},${c}) for input #${idx + 1}`);
        }
      }

      // Dark module
      assert.strictEqual(grid[size - 8][8], 1, `Dark module at (${size - 8}, 8) should be 1 for input #${idx + 1}`);
    }
  });

  it('1.6 QRCodeSVG React Component Markup Generation', () => {
    // Normal render
    const el = React.createElement(QRCodeSVG, {
      value: 'https://crm.rukn.com/share/test123',
      size: 110,
      margin: 1,
      color: '#1e293b',
      bgColor: '#f8fafc',
      title: 'Listing QR'
    });
    const html = renderToStaticMarkup(el);

    assert.ok(html.startsWith('<svg '), 'Component should render <svg>');
    assert.ok(html.includes('width="110"'), 'width should be 110');
    assert.ok(html.includes('height="110"'), 'height should be 110');
    assert.ok(html.includes('fill="#f8fafc"'), 'bgColor rect should be present');
    assert.ok(html.includes('fill="#1e293b"'), 'color path fill should match');
    assert.ok(html.includes('aria-label="Listing QR"'), 'aria-label should match title');

    // Falsy value returns null (empty markup)
    const emptyEl = React.createElement(QRCodeSVG, { value: '' });
    assert.strictEqual(renderToStaticMarkup(emptyEl), '', 'Empty value should render empty string');

    const nullEl = React.createElement(QRCodeSVG, { value: null });
    assert.strictEqual(renderToStaticMarkup(nullEl), '', 'Null value should render empty string');
  });
});

// ============================================================================
// 2. Print Layout & PropertyOfferModal Stress Tests
// ============================================================================
describe('2. Print Layout & PropertyOfferModal Stress Tests', () => {
  let PropertyOfferModal;

  // Compile PropertyOfferModal using esbuild with mocked CSS modules
  it('2.0 Load PropertyOfferModal Component via esbuild', async () => {
    const entryCode = `
      import PropertyOfferModal from './src/components/PropertyOfferModal.jsx';
      export default PropertyOfferModal;
    `;

    const buildResult = await esbuild.build({
      stdin: {
        contents: entryCode,
        resolveDir: process.cwd(),
        loader: 'jsx',
      },
      bundle: true,
      platform: 'node',
      format: 'esm',
      external: ['react', 'react-dom', 'react-dom/server', 'lucide-react'],
      write: false,
      plugins: [{
        name: 'css-module-mock',
        setup(b) {
          b.onResolve({ filter: /\.module\.css$/ }, args => ({ path: args.path, namespace: 'css-module' }));
          b.onLoad({ filter: /.*/, namespace: 'css-module' }, () => ({
            contents: 'export default new Proxy({}, { get: (t, p) => String(p) });',
            loader: 'js'
          }));
        }
      }],
      alias: {
        '@': './src'
      }
    });

    const tmpFile = path.resolve('./node_modules/.tmp_test_modal_bundle.mjs');
    fs.writeFileSync(tmpFile, buildResult.outputFiles[0].text);
    const mod = await import(tmpFile);
    PropertyOfferModal = mod.default;
    fs.unlinkSync(tmpFile);

    assert.ok(PropertyOfferModal, 'PropertyOfferModal should load successfully');
  });

  it('2.1 CSS @media print Rules and A4 Dimension Constraints', () => {
    const cssPath = path.resolve('./src/components/PropertyOfferModal.module.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Verify @media print exists
    assert.ok(cssContent.includes('@media print'), 'Missing @media print block');

    // Verify A4 page declaration
    assert.ok(cssContent.includes('size: A4 portrait;'), 'Must specify A4 portrait size');
    assert.ok(cssContent.includes('margin: 8mm 10mm;'), 'Must specify printable margin (8mm 10mm)');

    // Verify print width/height mathematical containment:
    // A4 height is 297mm. With 8mm top & bottom margin: 297 - 16 = 281mm available.
    // .offerSheet must not exceed 281mm height!
    assert.ok(cssContent.includes('height: 275mm !important;'), '.offerSheet height must be 275mm to guarantee 1-page fit');
    assert.ok(cssContent.includes('max-height: 275mm !important;'), '.offerSheet max-height must be 275mm');
    assert.ok(cssContent.includes('width: 190mm !important;'), '.offerSheet width must be 190mm');
    assert.ok(cssContent.includes('max-width: 190mm !important;'), '.offerSheet max-width must be 190mm');

    // Verify page overflow suppression
    assert.ok(cssContent.includes('page-break-after: avoid !important;'), 'page-break-after avoid missing');
    assert.ok(cssContent.includes('page-break-inside: avoid !important;'), 'page-break-inside avoid missing');
    assert.ok(cssContent.includes('break-inside: avoid !important;'), 'break-inside avoid missing');

    // Verify screen UI suppression during print
    assert.ok(cssContent.includes('.noPrint,'), '.noPrint must be hidden');
    assert.ok(cssContent.includes('.previewBar,'), '.previewBar must be hidden');
    assert.ok(cssContent.includes('button {'), 'buttons must be hidden');
    assert.ok(cssContent.includes('display: none !important;'), 'hidden elements must use display: none !important');

    // Verify color printing preservation
    assert.ok(cssContent.includes('-webkit-print-color-adjust: exact !important;'), 'Exact print colors must be enforced');
    assert.ok(cssContent.includes('print-color-adjust: exact !important;'), 'Standard print-color-adjust must be enforced');
  });

  it('2.2 Full Off-Plan Property Rendering (Egypt, EGP, Payment Plan, Tour)', () => {
    const fullProp = {
      _id: '670f5e1f9a2b3c4d5e6f7a8b',
      title: 'Lavish 4BR Sky Villa in New Cairo',
      price: 18500000,
      currency: 'EGP',
      country: 'Egypt',
      branch: 'New Cairo Branch',
      listingCategory: 'primary_offplan',
      propertyType: 'villa',
      status: 'available',
      developer: {
        name: 'Palm Hills Developments',
        projectName: 'Palm Hills New Cairo',
        deliveryDate: '2027-12-01',
        finishingType: 'semi_finished'
      },
      location: {
        address: 'Plot 4, Golden Square',
        area: 'Fifth Settlement',
        city: 'New Cairo'
      },
      features: {
        area: { value: 385, unit: 'sqm' },
        bedrooms: 4,
        bathrooms: 5
      },
      paymentPlan: {
        downPaymentPercent: 10,
        installmentYears: 8,
        installmentFrequency: 'quarterly',
        handoverPaymentPercent: 15,
        maintenancePercent: 8
      },
      listedBy: {
        firstName: 'Ahmed',
        lastName: 'Zaki',
        email: 'ahmed.zaki@rukn.eg',
        phone: '+20 100 123 4567'
      },
      virtualTour: {
        shareToken: 'tour_tok_12345'
      },
      media: {
        images: [{ url: 'https://cloudinary.com/test_cover.jpg', isCover: true }]
      }
    };

    const markup = renderToStaticMarkup(React.createElement(PropertyOfferModal, {
      isOpen: true,
      onClose: () => {},
      property: fullProp
    }));

    assert.ok(markup, 'Markup should be rendered');
    assert.ok(!markup.includes('NaN'), 'Markup must not contain NaN');
    assert.ok(!markup.includes('undefined'), 'Markup must not contain undefined');

    // Key assertions
    assert.ok(markup.includes('Lavish 4BR Sky Villa in New Cairo'), 'Title missing');
    assert.ok(markup.includes('Palm Hills Developments'), 'Developer missing');
    assert.ok(markup.includes('OFF-PLAN / قيد الإنشاء'), 'Off-plan badge missing');
    assert.ok(markup.includes('360° VIRTUAL WALKTHROUGH'), '360 tour badge missing');
    assert.ok(markup.includes('Ahmed Zaki'), 'Agent name missing');
    assert.ok(markup.includes('Official Licensed Agency Brokerage'), 'Egypt license missing');
    assert.ok(markup.includes('downPaymentPercent') || markup.includes('Down Payment (10%)'), 'Down payment card missing');
    assert.ok(markup.includes('svg'), 'QR SVG missing');
  });

  it('2.3 Regional License & Currency Alignment (UAE & Saudi Arabia)', () => {
    // UAE Test
    const uaeProp = {
      _id: '670f5e1f9a2b3c4d5e6f7a8c',
      title: 'Downtown Dubai Luxury Apartment',
      price: 3400000,
      currency: 'AED',
      country: 'UAE',
      branch: 'Dubai Downtown',
      propertyType: 'apartment',
      status: 'available',
      paymentPlan: { downPaymentPercent: 20, installmentYears: 3 },
      listedBy: { firstName: 'Sami', lastName: 'Najjar' }
    };

    const uaeMarkup = renderToStaticMarkup(React.createElement(PropertyOfferModal, {
      isOpen: true,
      onClose: () => {},
      property: uaeProp
    }));

    assert.ok(uaeMarkup.includes('RERA / Trakheesi Permit Approved'), 'UAE RERA badge missing');
    assert.ok(uaeMarkup.includes('AED'), 'AED currency symbol missing');

    // Saudi Arabia Test
    const ksaProp = {
      _id: '670f5e1f9a2b3c4d5e6f7a8d',
      title: 'Al Malqa Riyadh Contemporary Villa',
      price: 4200000,
      currency: 'SAR',
      country: 'Saudi Arabia',
      branch: 'Riyadh North',
      propertyType: 'villa',
      status: 'available',
      paymentPlan: { downPaymentPercent: 15, installmentYears: 5 },
      listedBy: { firstName: 'Fahad', lastName: 'Al-Otaibi' }
    };

    const ksaMarkup = renderToStaticMarkup(React.createElement(PropertyOfferModal, {
      isOpen: true,
      onClose: () => {},
      property: ksaProp
    }));

    assert.ok(ksaMarkup.includes('REGA / FAL Advertising License Verified'), 'KSA REGA badge missing');
    assert.ok(ksaMarkup.includes('SAR'), 'SAR currency symbol missing');
  });

  it('2.4 Missing Optional Data Fallback Rendering', () => {
    // Property with bare minimum fields: no paymentPlan, no developer, no tour, no agent, no media, no features
    const minimalProp = {
      _id: '670f5e1f9a2b3c4d5e6f7a8e',
      title: 'Generic Resale Apartment',
      price: 2500000,
      shareToken: 'share_xyz789'
    };

    const markup = renderToStaticMarkup(React.createElement(PropertyOfferModal, {
      isOpen: true,
      onClose: () => {},
      property: minimalProp
    }));

    assert.ok(markup, 'Minimal property should render without throwing');
    assert.ok(!markup.includes('NaN'), 'Minimal markup must not contain NaN');
    assert.ok(!markup.includes('undefined'), 'Minimal markup must not contain undefined');

    // 1. Fallback for payment plan -> Cash Plan Box
    assert.ok(markup.includes('100% Cash Purchase:'), 'Cash plan fallback missing');
    assert.ok(markup.includes('Reservation Deposit:'), 'Earnest deposit fallback missing');
    assert.ok(markup.includes('Mortgage Financing:'), 'Mortgage fallback missing');

    // 2. Fallback for developer -> no developer subhead, finishing falls back to Fully Finished, delivery falls back to Ready to Move
    assert.ok(markup.includes('Fully Finished'), 'Finishing fallback missing');
    assert.ok(markup.includes('Ready to Move'), 'Delivery date fallback missing');

    // 3. Fallback for tour -> online brochure QR
    assert.ok(markup.includes('ONLINE BROCHURE'), 'Tour fallback to brochure badge missing');
    assert.ok(markup.includes('Scan for full listing &amp; photo gallery') || markup.includes('Scan for full listing & photo gallery'), 'Brochure English text missing');
    assert.ok(markup.includes('امسح الكود لتفاصيل الوحدة كاملة'), 'Brochure Arabic text missing');

    // 4. Fallback for listedBy -> Rukn Senior Property Consultant
    assert.ok(markup.includes('Rukn Senior Property Consultant'), 'Agent name fallback missing');
    assert.ok(markup.includes('+20 100 000 0000'), 'Agent phone fallback missing');
    assert.ok(markup.includes('sales@ruknrealestate.com'), 'Agent email fallback missing');

    // 5. Fallback for location -> Prime Brokerage Location
    assert.ok(markup.includes('Prime Brokerage Location'), 'Location fallback missing');

    // 6. Fallback for media -> placeholder image
    assert.ok(markup.includes('/placeholder-property.jpg'), 'Cover image fallback missing');

    // 7. Fallback for features -> "—"
    assert.ok(markup.includes('—'), 'Specs placeholder missing');
  });

  it('2.5 Closed State and Null Property Return Null', () => {
    // isOpen = false
    const closedMarkup = renderToStaticMarkup(React.createElement(PropertyOfferModal, {
      isOpen: false,
      onClose: () => {},
      property: { _id: '123' }
    }));
    assert.strictEqual(closedMarkup, '', 'When isOpen=false, should render empty');

    // property = null
    const nullPropMarkup = renderToStaticMarkup(React.createElement(PropertyOfferModal, {
      isOpen: true,
      onClose: () => {},
      property: null
    }));
    assert.strictEqual(nullPropMarkup, '', 'When property=null, should render empty');
  });

  it('2.6 Adversarial Edge Case Stress: High Values, Zero Division, Case Variations, Extreme Text', () => {
    const adversarialProp = {
      _id: '670f5e1f9a2b3c4d5e6f7a8f',
      title: 'Ultra-Luxury Megastructure Palace '.repeat(3),
      price: 250000000, // 250M
      currency: 'SAR',
      country: 'saudi_arabia', // Lowercase with underscore
      branch: 'Capital Branch',
      listingCategory: 'primary_offplan',
      propertyType: 'villa',
      status: 'available',
      developer: {
        name: 'Dar Al Arkan Real Estate',
        projectName: 'Shams Ar Riyadh Megaproject',
        deliveryDate: null,
        finishingType: 'core_and_shell'
      },
      location: {}, // Empty location object
      media: { images: [] }, // Empty images array
      features: null,
      paymentPlan: {
        downPaymentPercent: 0,
        installmentYears: 0, // Zero years: must not divide by zero!
        installmentFrequency: 'unknown_freq', // Unknown frequency fallback
        handoverPaymentPercent: 0,
        maintenancePercent: 0
      },
      listedBy: null
    };

    const markup = renderToStaticMarkup(React.createElement(PropertyOfferModal, {
      isOpen: true,
      onClose: () => {},
      property: adversarialProp,
      agencyName: 'شركة ركن الخليج للاستشارات والتطوير العقاري والمقاولات العامة ذ.م.م - فرع الرياض'
    }));

    assert.ok(markup, 'Adversarial render should succeed without throwing');
    assert.ok(!markup.includes('NaN'), 'Must not contain NaN');
    assert.ok(!markup.includes('undefined'), 'Must not contain undefined');
    assert.ok(markup.includes('REGA / FAL Advertising License Verified'), 'Should identify lowercase saudi_arabia country');
    assert.ok(markup.includes('Prime Brokerage Location'), 'Should safely handle empty location');
    assert.ok(markup.includes('/placeholder-property.jpg'), 'Should safely handle empty images array');
  });
});
