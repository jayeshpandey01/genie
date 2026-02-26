// Test setup file
import mongoose from 'mongoose';

// Set test timeout
jest.setTimeout(30000);

// Global test configuration
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Configure mongoose for tests (using newer mongoose syntax)
mongoose.set('strictQuery', false);

// Global test cleanup
afterAll(async () => {
    // Close all mongoose connections
    await mongoose.disconnect();
    
    // Close any remaining handles
    if (global.gc) {
        global.gc();
    }
});