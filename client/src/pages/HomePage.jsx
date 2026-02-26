import AllServices from "../components/AllServices";
import Hero from "../components/Hero";
import ServicesSection from "../components/ServicesSection";
import MarketplaceShowcase from "../components/MarketplaceShowcase";
import MarketplaceBanner from "../components/MarketplaceBanner";

export default function HomePage() {
    return (
        <>
            <Hero />
            <ServicesSection />
            <MarketplaceBanner />
            <MarketplaceShowcase />
            {/* <AllServices /> */}
        </>
    );
}
