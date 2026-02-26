import { Link } from "react-router-dom";
import { HiSparkles, HiFire, HiClock } from "react-icons/hi2";

export default function MarketplaceBanner() {
    const deals = [
        {
            icon: <HiSparkles className="w-6 h-6" />,
            title: "New Arrivals",
            description: "Fresh items added daily",
            color: "from-purple-500 to-pink-500",
            link: "/marketplace?sortBy=createdAt&sortOrder=desc"
        },
        {
            icon: <HiFire className="w-6 h-6" />,
            title: "Trending Now",
            description: "Most viewed items",
            color: "from-orange-500 to-red-500",
            link: "/marketplace?sortBy=views&sortOrder=desc"
        },
        {
            icon: <HiClock className="w-6 h-6" />,
            title: "Limited Time",
            description: "Best deals ending soon",
            color: "from-blue-500 to-cyan-500",
            link: "/marketplace?priceMax=100"
        }
    ];

    return (
        <div className="bg-[#FFFFEE] py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {deals.map((deal, index) => (
                        <Link
                            key={index}
                            to={deal.link}
                            className="group relative overflow-hidden rounded-2xl"
                        >
                            <div className={`bg-gradient-to-br ${deal.color} p-8 text-white relative overflow-hidden`}>
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        {deal.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 font-[NeuwMachina]">
                                        {deal.title}
                                    </h3>
                                    <p className="text-white/90 mb-4">
                                        {deal.description}
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all">
                                        Explore Now
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
