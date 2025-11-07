require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Property = require('../models/Property');
const Lease = require('../models/Lease');
const Payment = require('../models/Payment');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Message = require('../models/Message');

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Property.deleteMany({});
    await Lease.deleteMany({});
    await Payment.deleteMany({});
    await MaintenanceRequest.deleteMany({});
    await Message.deleteMany({});

    console.log('Creating users...');

    // Create Landlord
    const landlord = await User.create({
      name: 'John Landlord',
      email: 'landlord@test.com',
      password: 'Test123!',
      role: 'landlord',
      phone: '555-0101',
      isActive: true,
      isEmailVerified: true
    });

    // Create Tenants
    const tenant1 = await User.create({
      name: 'Alice Tenant',
      email: 'tenant1@test.com',
      password: 'Test123!',
      role: 'tenant',
      phone: '555-0201',
      isActive: true,
      isEmailVerified: true
    });

    const tenant2 = await User.create({
      name: 'Bob Tenant',
      email: 'tenant2@test.com',
      password: 'Test123!',
      role: 'tenant',
      phone: '555-0202',
      isActive: true,
      isEmailVerified: true
    });

    // Create Property Manager
    const manager = await User.create({
      name: 'Sarah Manager',
      email: 'manager@test.com',
      password: 'Test123!',
      role: 'manager',
      phone: '555-0301',
      isActive: true,
      isEmailVerified: true
    });

    console.log('Creating properties...');

    // Create Properties
    const property1 = await Property.create({
      landlord: landlord._id,
      name: 'Sunset Apartments - Unit 101',
      address: {
        street: '123 Main Street',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001'
      },
      type: 'apartment',
      description: 'Beautiful 2-bedroom apartment with modern amenities',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1200,
      rentAmount: 2500,
      depositAmount: 2500,
      amenities: ['Parking', 'Pool', 'Gym', 'Laundry'],
      status: 'occupied',
      isAvailable: false,
      currentTenant: tenant1._id,
      assignedManager: manager._id
    });

    const property2 = await Property.create({
      landlord: landlord._id,
      name: 'Green Valley House',
      address: {
        street: '456 Oak Avenue',
        city: 'San Diego',
        state: 'CA',
        zipCode: '92101'
      },
      type: 'house',
      description: 'Spacious 3-bedroom house with backyard',
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 1800,
      rentAmount: 3200,
      depositAmount: 3200,
      amenities: ['Garage', 'Backyard', 'Dishwasher'],
      status: 'occupied',
      isAvailable: false,
      currentTenant: tenant2._id
    });

    const property3 = await Property.create({
      landlord: landlord._id,
      name: 'Downtown Condo',
      address: {
        street: '789 City Plaza',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102'
      },
      type: 'condo',
      description: 'Modern condo in the heart of downtown',
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 850,
      rentAmount: 2800,
      depositAmount: 2800,
      amenities: ['Doorman', 'Rooftop Deck', 'Gym'],
      status: 'available',
      isAvailable: true
    });

    console.log('Creating leases...');

    // Create Leases
    const lease1 = await Lease.create({
      property: property1._id,
      landlord: landlord._id,
      tenant: tenant1._id,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      rentAmount: 2500,
      depositAmount: 2500,
      paymentDueDay: 1,
      terms: 'Standard lease agreement terms and conditions. Tenant is responsible for utilities. No pets allowed. Non-smoking property.',
      status: 'active',
      signatures: {
        landlord: {
          signed: true,
          signedAt: new Date('2023-12-15'),
          ipAddress: '127.0.0.1'
        },
        tenant: {
          signed: true,
          signedAt: new Date('2023-12-20'),
          ipAddress: '127.0.0.1'
        }
      }
    });

    const lease2 = await Lease.create({
      property: property2._id,
      landlord: landlord._id,
      tenant: tenant2._id,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-02-28'),
      rentAmount: 3200,
      depositAmount: 3200,
      paymentDueDay: 1,
      terms: 'Standard lease agreement terms and conditions. Tenant is responsible for lawn maintenance. One pet allowed with additional deposit.',
      status: 'active',
      signatures: {
        landlord: {
          signed: true,
          signedAt: new Date('2024-02-15'),
          ipAddress: '127.0.0.1'
        },
        tenant: {
          signed: true,
          signedAt: new Date('2024-02-18'),
          ipAddress: '127.0.0.1'
        }
      }
    });

    console.log('Creating payments...');

    // Create Payments
    await Payment.create({
      property: property1._id,
      lease: lease1._id,
      tenant: tenant1._id,
      landlord: landlord._id,
      amount: 2500,
      type: 'rent',
      description: 'January 2024 Rent',
      dueDate: new Date('2024-01-01'),
      paidDate: new Date('2024-01-01'),
      status: 'paid',
      paymentMethod: 'demo_card',
      demoPayment: {
        cardLast4: '4242',
        cardBrand: 'Visa',
        transactionId: 'TXN-1704067200000-123456',
        processingTime: 2340
      },
      receiptNumber: 'RCP-202401-0001'
    });

    await Payment.create({
      property: property1._id,
      lease: lease1._id,
      tenant: tenant1._id,
      landlord: landlord._id,
      amount: 2500,
      type: 'rent',
      description: 'February 2024 Rent',
      dueDate: new Date('2024-02-01'),
      paidDate: new Date('2024-02-02'),
      status: 'paid',
      paymentMethod: 'demo_card',
      demoPayment: {
        cardLast4: '4242',
        cardBrand: 'Visa',
        transactionId: 'TXN-1706745600000-789012',
        processingTime: 1890
      },
      receiptNumber: 'RCP-202402-0002'
    });

    await Payment.create({
      property: property1._id,
      lease: lease1._id,
      tenant: tenant1._id,
      landlord: landlord._id,
      amount: 2500,
      type: 'rent',
      description: 'November 2024 Rent',
      dueDate: new Date('2024-11-01'),
      status: 'pending'
    });

    await Payment.create({
      property: property2._id,
      lease: lease2._id,
      tenant: tenant2._id,
      landlord: landlord._id,
      amount: 3200,
      type: 'rent',
      description: 'November 2024 Rent',
      dueDate: new Date('2024-11-01'),
      paidDate: new Date('2024-10-30'),
      status: 'paid',
      paymentMethod: 'demo_card',
      demoPayment: {
        cardLast4: '5555',
        cardBrand: 'Mastercard',
        transactionId: 'TXN-1730246400000-345678',
        processingTime: 2120
      },
      receiptNumber: 'RCP-202411-0003'
    });

    await Payment.create({
      property: property2._id,
      lease: lease2._id,
      tenant: tenant2._id,
      landlord: landlord._id,
      amount: 3200,
      type: 'rent',
      description: 'December 2024 Rent',
      dueDate: new Date('2024-12-01'),
      status: 'pending'
    });

    console.log('Creating maintenance requests...');

    // Create Maintenance Requests
    await MaintenanceRequest.create({
      property: property1._id,
      tenant: tenant1._id,
      landlord: landlord._id,
      assignedTo: manager._id,
      title: 'Leaking Kitchen Faucet',
      description: 'The kitchen faucet has been leaking for the past few days. It drips constantly even when fully closed.',
      category: 'plumbing',
      priority: 'medium',
      status: 'in_progress',
      comments: [
        {
          user: tenant1._id,
          text: 'The leak is getting worse',
          createdAt: new Date()
        },
        {
          user: manager._id,
          text: 'I will come by tomorrow to take a look',
          createdAt: new Date()
        }
      ]
    });

    await MaintenanceRequest.create({
      property: property2._id,
      tenant: tenant2._id,
      landlord: landlord._id,
      title: 'HVAC Not Working',
      description: 'The heating system is not turning on. Tried adjusting thermostat but nothing happens.',
      category: 'hvac',
      priority: 'high',
      status: 'open'
    });

    await MaintenanceRequest.create({
      property: property1._id,
      tenant: tenant1._id,
      landlord: landlord._id,
      assignedTo: manager._id,
      title: 'Light Bulb Replacement',
      description: 'Hallway light bulb needs replacement',
      category: 'other',
      priority: 'low',
      status: 'resolved',
      completedDate: new Date('2024-10-15')
    });

    console.log('Creating messages...');

    // Create Messages
    const conversationId1 = Message.generateConversationId([landlord._id.toString(), tenant1._id.toString()]);
    
    await Message.create({
      conversation: conversationId1,
      sender: tenant1._id,
      recipients: [landlord._id],
      subject: 'Lease Renewal',
      content: 'Hi, I would like to discuss renewing my lease for another year.',
      type: 'direct',
      relatedTo: 'lease',
      relatedId: lease1._id
    });

    await Message.create({
      conversation: conversationId1,
      sender: landlord._id,
      recipients: [tenant1._id],
      content: 'Hello! I would be happy to discuss lease renewal. Let me prepare a new lease agreement.',
      type: 'direct',
      relatedTo: 'lease',
      relatedId: lease1._id,
      isRead: [{ user: tenant1._id, readAt: new Date() }]
    });

    console.log('✅ Database seeded successfully!');
    console.log('\nTest Accounts:');
    console.log('===============');
    console.log('Landlord:  landlord@test.com / Test123!');
    console.log('Tenant 1:  tenant1@test.com / Test123!');
    console.log('Tenant 2:  tenant2@test.com / Test123!');
    console.log('Manager:   manager@test.com / Test123!');
    console.log('===============\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
