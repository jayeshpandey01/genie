import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
    },
    paymentId: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined values
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        required: true,
        default: "INR",
    },
    status: {
        type: String,
        enum: ['SERVICE_BOOKED', 'PROVIDER_ASSIGNED', 'SERVICE_COMPLETED', 'COD_PENDING', 'COD_PAID', 'PAYMENT_AUTHORIZED'],
        default: 'SERVICE_BOOKED'
    },
    paymentMethod: {
        type: String,
        enum: ['online', 'cod'],
        default: 'online'
    },
    method: {
        type:String,
    },
    failureReason: {
        type: String,
    },
    // Worker assignment
    assignedWorker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Worker",
    },
    assignedAt: {
        type: Date,
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    workerNotes: {
        type: String,
    },
    completedAt: {
        type: Date,
    },
    items: [
        {
            serviceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Service",
                required: true,
            },
            image: String,
            title: String,
            quantity: Number,
            price: Number,
            total: Number,
            assignedWorker: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Worker",
            },
        },
    ],
    // Worker assignments for all items
    workerAssignments: [
        {
            serviceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Service",
            },
            workerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Worker",
            },
            workerName: String,
            workerPhone: String,
            assignedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    summary: {
        subtotal: Number,
        tax: Number,
        total: Number,
        itemCount: Number,
    },
    customerDetails: {
        name: String,
        email: String,
        phone: String,
    },
    attempts: {
        type: Number,
    },
    lastAttemptAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Update the updatedAt timestamp before saving
paymentSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
