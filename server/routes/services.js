// routes/services.js
import express from "express";
import Service from "../models/Service.js";
import ServiceDetail from "../models/ServiceDetail.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: "Error fetching services" });
    }
});

router.get("/:serviceName/details", async (req, res) => {
    try {
        const requestedServiceName = decodeURIComponent(req.params.serviceName);
        console.log(`🔍 Looking for service details: "${requestedServiceName}"`);
        
        // Try exact match first
        let serviceDetail = await ServiceDetail.findOne({
            serviceName: requestedServiceName,
        });
        
        // If not found, try case-insensitive search
        if (!serviceDetail) {
            serviceDetail = await ServiceDetail.findOne({
                serviceName: { $regex: new RegExp(`^${requestedServiceName}$`, 'i') }
            });
        }
        
        // If still not found, try partial match
        if (!serviceDetail) {
            serviceDetail = await ServiceDetail.findOne({
                serviceName: { $regex: new RegExp(requestedServiceName, 'i') }
            });
        }
        
        if (serviceDetail) {
            console.log(`✅ Found service details for: "${serviceDetail.serviceName}"`);
            res.json(serviceDetail);
        } else {
            console.log(`❌ Service details not found for: "${requestedServiceName}"`);
            
            // List available service details for debugging
            const availableServices = await ServiceDetail.find({}, 'serviceName');
            console.log('Available service details:', availableServices.map(s => s.serviceName));
            
            res.status(404).json({ 
                message: "Service details not found",
                requested: requestedServiceName,
                available: availableServices.map(s => s.serviceName)
            });
        }
    } catch (error) {
        console.error("Error fetching service details:", error);
        res.status(500).json({ message: "Error fetching service details", error: error.message });
    }
});

export default router;
