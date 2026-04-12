import { useLanguage } from "@/hooks/useLanguage";
const Team = () => {
    const { t } = useLanguage();
    return (
        <div style={{ padding: '2rem' }}>
            <h1>{t('dashboard_extra.team')}</h1>
            <p>Team management - to be implemented</p>
        </div>
    );
};

export default Team;
