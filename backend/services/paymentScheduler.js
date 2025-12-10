const cron = require('node-cron');
const Lease = require('../models/Lease');
const Payment = require('../models/Payment');

// Function to generate monthly rent payments for active leases
const generateMonthlyPayments = async () => {
  try {
    console.log('Running monthly payment generation...');
    
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Find all active leases where payment is due today
    const activeLeases = await Lease.find({
      status: 'active',
      paymentDueDay: currentDay,
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate('property tenant landlord');
    
    console.log(`Found ${activeLeases.length} leases with payment due today`);
    
    let createdCount = 0;
    
    for (const lease of activeLeases) {
      // Check if payment already exists for this month
      const existingPayment = await Payment.findOne({
        lease: lease._id,
        dueDate: {
          $gte: new Date(currentYear, currentMonth, 1),
          $lt: new Date(currentYear, currentMonth + 1, 1)
        }
      });
      
      if (existingPayment) {
        console.log(`Payment already exists for lease ${lease._id} this month`);
        continue;
      }
      
      // Create new payment
      const dueDate = new Date(currentYear, currentMonth, lease.paymentDueDay);
      
      const payment = new Payment({
        property: lease.property._id,
        tenant: lease.tenant._id,
        landlord: lease.landlord._id,
        lease: lease._id,
        amount: lease.rentAmount,
        type: 'rent',
        description: `Monthly rent for ${lease.property.name} - ${getMonthName(currentMonth)} ${currentYear}`,
        dueDate: dueDate,
        status: 'pending'
      });
      
      await payment.save();
      createdCount++;
      console.log(`Created payment for lease ${lease._id}`);
    }
    
    console.log(`Monthly payment generation complete. Created ${createdCount} payments.`);
    return { success: true, created: createdCount };
  } catch (error) {
    console.error('Error generating monthly payments:', error);
    return { success: false, error: error.message };
  }
};

// Function to check for overdue payments and update status
const updateOverduePayments = async () => {
  try {
    console.log('Checking for overdue payments...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await Payment.updateMany(
      {
        status: 'pending',
        dueDate: { $lt: today }
      },
      {
        $set: { status: 'overdue' }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} payments to overdue status`);
    return { success: true, updated: result.modifiedCount };
  } catch (error) {
    console.error('Error updating overdue payments:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to get month name
const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
};

// Initialize cron jobs
const initPaymentScheduler = () => {
  // Run every day at 12:01 AM to generate payments and check for overdue
  cron.schedule('1 0 * * *', async () => {
    console.log('Running scheduled payment tasks...');
    await generateMonthlyPayments();
    await updateOverduePayments();
  });
  
  console.log('Payment scheduler initialized - will run daily at 12:01 AM');
};

module.exports = {
  initPaymentScheduler,
  generateMonthlyPayments,
  updateOverduePayments
};
