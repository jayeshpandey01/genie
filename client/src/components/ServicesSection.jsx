import { useEffect, useState } from "react";
import { getServices } from "../utils/api";
import Services from "./Services";
import SkeletonService from "./SkeletonService";
import { SkeletonTheme } from "react-loading-skeleton";
import PortalLayout from "./PortalLayout";
import ServiceDetails from "./ServiceDetails";

export default function ServicesSection() {
    const [servicesData, setServicesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);

    const handleServiceClick = (serviceName) => {
        setSelectedService(serviceName);
    };

    useEffect(() => {
        const fetchServices = async () => {
            try {
                setIsLoading(true);
                console.log("🔄 Fetching services...");
                const data = await getServices();
                console.log("✅ Services fetched:", data.length, "services");
                
                if (data.length === 0) {
                    console.warn("⚠️ No services found in database");
                }
                
                // Sort services based on the 'order' property
                const sortedData = data.sort((a, b) => a.order - b.order);
                setServicesData(sortedData);
            } catch (error) {
                console.error("❌ Error fetching services:", error);
                console.error("💡 Make sure server is running and database has services");
            } finally {
                setIsLoading(false);
            }
        };

        fetchServices();
    }, []);

    return (
        <>
            <div id="services">
                <h1 className="text-4xl py-4 font-[NeuwMachinaBold]">
                    OUR SERVICES
                </h1>
                <SkeletonTheme baseColor="#bfdbfe" highlightColor="#F5F5DC">
                    <div className="w-full grid grid-cols-1 min-[425px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 py-4 text-center text-sm border-t border-black">
                        {isLoading
                            ? Array(6)
                                  .fill()
                                  .map((_, index) => (
                                      <SkeletonService key={index} />
                                  ))
                            : servicesData.length > 0 
                            ? servicesData.map((service) => (
                                  <Services
                                      key={service._id}
                                      serviceImage={service.serviceImage}
                                      serviceName={service.serviceName}
                                      onServiceClick={handleServiceClick}
                                  />
                              ))
                            : (
                                <div className="col-span-full text-center py-8">
                                    <p className="text-gray-600 text-lg">No services available</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        Please run: <code>node scripts/fixServices.js</code> in the server directory
                                    </p>
                                </div>
                            )}
                    </div>
                </SkeletonTheme>
            </div>
            <PortalLayout
                isOpen={!!selectedService}
                onClose={() => setSelectedService(null)}
            >
                {selectedService && (
                    <ServiceDetails serviceName={selectedService} />
                )}
            </PortalLayout>
        </>
    );
}
