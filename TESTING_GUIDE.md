# Testing Guide - All View Details Pages

## 🧪 How to Test All Detail Pages

### Prerequisites:
1. Backend server running on `http://localhost:5000`
2. Frontend server running on `http://localhost:3000`
3. Database seeded with test data

### Start Servers:
```powershell
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm start
```

---

## Test 1: Property Details Page

### Steps:
1. **Login** as landlord (landlord@test.com / Test123!)
2. Go to **Properties** page
3. Click **"View Details"** on any property card
4. ✅ **Expected**: Should see property details page with:
   - Property image or placeholder
   - Property name, status badge, type
   - Monthly rent, bedrooms, bathrooms, square feet
   - Full address
   - Description (if available)
   - Amenities list
   - Landlord information
   - Current tenant (if occupied)
   - Property manager
   - Quick action buttons
   - **Edit Property** button (landlords only)
   - **Delete Property** button (landlords only)

5. Click **"Edit Property"** button
   - ✅ Should navigate to edit form (or show "coming soon")

6. Click **"View Payments"** button
   - ✅ Should navigate to Payments page

7. Click **"← Back to Properties"**
   - ✅ Should return to Properties list

### Test as Tenant:
1. **Logout** and login as tenant (tenant@test.com / Test123!)
2. Go to **Properties** page
3. Click **"View Details"**
4. ✅ **Expected**: Should see property details but:
   - ❌ NO "Edit Property" button
   - ❌ NO "Delete Property" button
   - ✅ Can view all information
   - ✅ Can use quick action buttons

---

## Test 2: Maintenance Details Page

### Steps:
1. **Login** as landlord (landlord@test.com / Test123!)
2. Go to **Maintenance** page
3. Click **"View Details"** on any maintenance request
4. ✅ **Expected**: Should see maintenance details page with:
   - Request title with priority badge (Emergency/High/Medium/Low)
   - Status badge (Pending/In Progress/Completed/Cancelled)
   - Creation date
   - Full description
   - Images (if uploaded)
   - Property information with link
   - Comments section
   - Add comment form
   - Reporter information (tenant)
   - Assigned to (if assigned)
   - Timeline (Created, Completed)
   - Status action buttons (landlords only)

5. **Test Status Updates** (as landlord):
   - If status is "Pending", click **"Start Work"**
     - ✅ Status should change to "In Progress"
     - ✅ Badge color should change
   - If status is "In Progress", click **"Mark Complete"**
     - ✅ Status should change to "Completed"
     - ✅ Completion date should appear in timeline

6. **Test Comments**:
   - Type a comment in the text area
   - Click **"Add Comment"**
   - ✅ Comment should appear in the list immediately
   - ✅ Your name and timestamp should show

7. Click **"View Property Details"** button
   - ✅ Should navigate to property details page

8. Click **"← Back to Maintenance"**
   - ✅ Should return to Maintenance list

### Test as Tenant:
1. **Logout** and login as tenant (tenant@test.com / Test123!)
2. Go to **Maintenance** page
3. Click **"View Details"** on your request
4. ✅ **Expected**:
   - Can view all information
   - Can add comments
   - ❌ NO status update buttons (Start Work, Mark Complete, Cancel)

---

## Test 3: Lease Details Page

### Steps:
1. **Login** as landlord (landlord@test.com / Test123!)
2. Go to **Leases** page
3. Click **"View Details"** on any lease
4. ✅ **Expected**: Should see lease details page with:
   - "Lease Agreement" title with status badge
   - "Fully Signed" green banner (if both signed)
   - Property information with link
   - Lease terms grid:
     - Monthly Rent
     - Security Deposit
     - Start Date
     - End Date
     - Payment Due Day
     - Late Fee
   - Additional terms & conditions
   - Digital signatures section:
     - Landlord signature image (if signed)
     - Tenant signature image (if signed)
     - Signature dates
     - "Awaiting signature" box (if not signed)
   - Landlord information card
   - Tenant information card
   - Lease duration calculation
   - **Sign Lease** button (if not signed)
   - **Download PDF** button

5. **Test Signing** (if not signed):
   - Click **"Sign Lease"** button
   - ✅ Modal should open with SignaturePad
   - Draw a signature with mouse/touch
   - Click **"Save Signature"**
   - ✅ Modal should close
   - ✅ Signature should appear in the lease
   - ✅ Signature date should show
   - ✅ "Sign Lease" button should disappear

6. **Test Download PDF**:
   - Click **"Download PDF"**
   - ✅ PDF download should start (or show "coming soon")

7. Click **"View Property Details"**
   - ✅ Should navigate to property details

8. Click **"← Back to Leases"**
   - ✅ Should return to Leases list

### Test as Tenant:
1. **Logout** and login as tenant (tenant@test.com / Test123!)
2. Go to **Leases** page
3. Click **"View Details"** on your lease
4. ✅ **Expected**:
   - Can view all information
   - Can sign if not signed yet (tenant side only)
   - Cannot sign landlord side
   - Can download PDF

---

## Test 4: Navigation Between Pages

### Flow 1: Property → Lease → Property
1. Go to **Properties** → View Details
2. Click **"View Lease"**
3. ✅ Should go to Leases page
4. From Leases, click **"View Details"** on a lease
5. Click **"View Property Details"**
6. ✅ Should return to the same property

### Flow 2: Property → Maintenance → Property
1. Go to **Properties** → View Details
2. Click **"Maintenance Requests"**
3. ✅ Should go to Maintenance page
4. Click **"View Details"** on a request
5. Click **"View Property Details"**
6. ✅ Should show the property details

### Flow 3: Dashboard → Details Pages
1. Go to **Dashboard**
2. Click any quick action (Add Property, View Payments, etc.)
3. ✅ Should navigate correctly
4. Click **"View Details"** on any item
5. ✅ Should show detail page

---

## Test 5: Error Handling

### Test Invalid ID:
1. Manually navigate to: `http://localhost:3000/properties/invalid123`
2. ✅ **Expected**: Error message "Property not found" or "Failed to fetch"
3. ✅ "Back to Properties" button should work

### Test Unauthorized Access:
1. **Login as tenant**
2. Try to access a property you don't have access to
3. ✅ **Expected**: Error message "Not authorized"
4. ✅ Should be redirected or show error

---

## Test 6: Responsive Design

### Desktop (1920px+):
1. Open browser in full screen
2. Navigate to any detail page
3. ✅ Sidebar should show on the right
4. ✅ Main content should use full width
5. ✅ Images should be large and clear

### Tablet (768px):
1. Resize browser to ~768px width
2. Navigate to any detail page
3. ✅ Sidebar should move below main content
4. ✅ Layout should stack vertically
5. ✅ Buttons should remain accessible

### Mobile (480px):
1. Resize browser to ~480px width
2. Navigate to any detail page
3. ✅ All content should stack vertically
4. ✅ Images should resize appropriately
5. ✅ Buttons should be full width
6. ✅ Text should be readable

---

## ✅ Success Criteria

All tests should pass with:
- ✅ No "Page Not Found" errors
- ✅ All data displays correctly
- ✅ All buttons work as expected
- ✅ Navigation flows work smoothly
- ✅ Role-based access control works
- ✅ Comments and status updates work
- ✅ Signatures can be added and displayed
- ✅ Responsive design works on all screen sizes
- ✅ Error messages display for invalid data
- ✅ Back buttons return to correct pages

---

## 🐛 Common Issues & Solutions

### Issue: "Property not found"
**Solution**: Ensure you're logged in as the correct user (landlord who owns the property, or tenant assigned to it)

### Issue: "Not authorized to view"
**Solution**: You're trying to access a resource you don't have permission for. Login as the correct user.

### Issue: Images not loading
**Solution**: 
1. Check backend is running
2. Check `uploads/` folder exists in server directory
3. Verify image paths start with `/uploads/`

### Issue: Signature modal not appearing
**Solution**: Ensure you have permission to sign (landlord can sign landlord side, tenant can sign tenant side)

### Issue: Comments not showing
**Solution**: Refresh the page after adding a comment, or check the backend logs for errors

---

## 📊 Test Results Template

```
✅ Property Details Page - Working
✅ Maintenance Details Page - Working
✅ Lease Details Page - Working
✅ Navigation Flow - Working
✅ Role-Based Access - Working
✅ Responsive Design - Working
✅ Error Handling - Working

OVERALL STATUS: ✅ ALL TESTS PASSED
```

---

**Last Updated**: November 7, 2025
**Tester**: _____________
**Date Tested**: _____________
