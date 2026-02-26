import mongoose from "mongoose";
import dotenv from "dotenv";
import ServiceDetail from "../models/ServiceDetail.js";

dotenv.config();

const fixImagePaths = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const serviceDetails = await ServiceDetail.find({});
        let fixedCount = 0;

        for (const serviceDetail of serviceDetails) {
            let modified = false;

            // Fix subcategories
            if (serviceDetail.subcategories) {
                for (const [subCatName, subCatData] of serviceDetail.subcategories) {
                    // Fix subcategory image
                    if (subCatData.image && subCatData.image.startsWith('/')) {
                        subCatData.image = subCatData.image.substring(1);
                        modified = true;
                    }

                    // Fix service types
                    if (subCatData.serviceTypes) {
                        for (const [typeName, typeData] of subCatData.serviceTypes) {
                            if (typeData.image && typeData.image.startsWith('/')) {
                                typeData.image = typeData.image.substring(1);
                                modified = true;
                            }

                            // Fix categories within service types
                            if (typeData.categories) {
                                for (const category of typeData.categories) {
                                    if (category.categoryImage && category.categoryImage.startsWith('/')) {
                                        category.categoryImage = category.categoryImage.substring(1);
                                        modified = true;
                                    }

                                    // Fix service images
                                    if (category.services) {
                                        for (const service of category.services) {
                                            if (service.image && service.image.startsWith('/')) {
                                                service.image = service.image.substring(1);
                                                modified = true;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Fix direct categories
                    if (subCatData.categories) {
                        for (const category of subCatData.categories) {
                            if (category.categoryImage && category.categoryImage.startsWith('/')) {
                                category.categoryImage = category.categoryImage.substring(1);
                                modified = true;
                            }

                            // Fix service images
                            if (category.services) {
                                for (const service of category.services) {
                                    if (service.image && service.image.startsWith('/')) {
                                        service.image = service.image.substring(1);
                                        modified = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Fix direct services
            if (serviceDetail.services) {
                for (const service of serviceDetail.services) {
                    if (service.image && service.image.startsWith('/')) {
                        service.image = service.image.substring(1);
                        modified = true;
                    }
                }
            }

            if (modified) {
                await serviceDetail.save();
                fixedCount++;
                console.log(`✅ Fixed image paths for: ${serviceDetail.serviceName}`);
            }
        }

        console.log(`\n🎉 Fixed ${fixedCount} service detail(s)`);
    } catch (error) {
        console.error("❌ Error fixing image paths:", error);
    } finally {
        await mongoose.disconnect();
        console.log("✅ Disconnected from MongoDB");
    }
};

fixImagePaths();
