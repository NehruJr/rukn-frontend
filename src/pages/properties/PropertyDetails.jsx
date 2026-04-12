import { useLanguage } from "@/hooks/useLanguage";
const PropertyDetails = () => {
    const { t } = useLanguage();
    return (
        <div style={{ padding: '2rem' }}>
            <h1>{t('dashboard_extra.property_details')}</h1>
            <p>Property detail page - to be implemented</p>
        </div>
    );
};

export default PropertyDetails;
