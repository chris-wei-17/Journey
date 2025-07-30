# New Page Template Guide

This guide explains how to use the `template.tsx` file to quickly create new pages in the app.

## Quick Start

1. **Copy the template file:**
   ```bash
   cp client/src/pages/template.tsx client/src/pages/your-page-name.tsx
   ```

2. **Update the component name:**
   ```tsx
   export default function YourPageName() {
   ```

3. **Add to routing in `App.tsx`:**
   ```tsx
   // Add import
   import YourPageName from "@/pages/your-page-name";
   
   // Add route
   <Route path="/your-route" component={YourPageName} />
   ```

## Template Structure

The template includes:
- ✅ Proper header with back navigation
- ✅ Gradient background matching app theme
- ✅ DataChart component for visualization
- ✅ 2x2 metrics grid with placeholder cards
- ✅ QuickAccess component at bottom
- ✅ Proper spacing and layout
- ✅ Comments indicating what to customize

## Customization Checklist

### 1. Basic Information
- [ ] Page title in Header component
- [ ] Component function name
- [ ] File name

### 2. Chart Configuration
- [ ] Chart title
- [ ] Sample data (replace with real data later)
- [ ] Line color (hex code)
- [ ] Background color (rgba)
- [ ] Y-axis label

### 3. Metrics Cards (4 cards)
For each metric card:
- [ ] FontAwesome icon (`fas fa-icon-name`)
- [ ] Icon color (`text-color-500`)
- [ ] Metric name/label
- [ ] Replace "Coming Soon" with real data

### 4. Optional Sections
- [ ] Uncomment additional content section if needed
- [ ] Modify grid layout (grid-cols-2, grid-cols-3, etc.)
- [ ] Add custom sections as needed

## Example: Creating a "Habits" Page

1. **Copy and rename:**
   ```bash
   cp client/src/pages/template.tsx client/src/pages/habits.tsx
   ```

2. **Update component:**
   ```tsx
   export default function Habits() {
     // ... rest stays the same initially
     
     return (
       <div className="min-h-screen bg-gradient-to-br from-primary-600 to-lavender-600">
         <Header 
           title="Habits" // ← Change this
           showBackButton={false}
           onBack={handleBack}
         />
   ```

3. **Customize chart:**
   ```tsx
   <DataChart 
     title="Daily Habits" // ← Change this
     data={[
       // ← Replace with habits data
     ]}
     lineColor="#10b981" // ← Green for habits
     backgroundColor="rgba(16, 185, 129, 0.1)" // ← Matching green
     yAxisLabel="Completed" // ← Change this
   />
   ```

4. **Update metrics:**
   ```tsx
   <i className="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
   <p className="text-sm text-gray-600">Streak</p>
   <p className="text-xl font-bold text-gray-800">7 days</p>
   ```

5. **Add to App.tsx:**
   ```tsx
   import Habits from "@/pages/habits";
   
   // In routes section:
   <Route path="/habits" component={Habits} />
   ```

## Available Icons & Colors

### Common FontAwesome Icons
- `fa-chart-line` - Line chart
- `fa-trophy` - Achievement/trophy
- `fa-target` - Goals/targets
- `fa-calendar` - Calendar/schedule
- `fa-check-circle` - Completion/success
- `fa-clock` - Time/duration
- `fa-fire` - Streak/intensity
- `fa-star` - Rating/quality
- `fa-heart` - Health/wellness
- `fa-dumbbell` - Exercise/fitness

### Color Options
- `text-blue-500` - Blue theme
- `text-green-500` - Success/positive
- `text-yellow-500` - Warning/attention
- `text-red-500` - Error/negative
- `text-purple-500` - Creative/premium
- `text-orange-500` - Energy/activity
- `text-pink-500` - Health/wellness
- `text-indigo-500` - Technology/data

## Data Integration

When ready to add real data:

1. **Add API calls:**
   ```tsx
   const { data: yourData } = useQuery({
     queryKey: ['/api/your-endpoint'],
   });
   ```

2. **Replace sample data:**
   ```tsx
   data={yourData || []}
   ```

3. **Update metrics:**
   ```tsx
   <p className="text-xl font-bold text-gray-800">
     {yourData?.metric || 'Loading...'}
   </p>
   ```

## Tips

- Start with the template and customize gradually
- Keep the QuickAccess component at the bottom
- Use consistent colors throughout your page
- Test navigation and back button functionality
- Follow the existing app's design patterns
- Add loading and error states when integrating real data

## Navigation Integration

To add your new page to the app navigation:

1. **Add to hamburger menu** (if needed)
2. **Add to QuickAccess buttons** (if appropriate)
3. **Link from other pages** (if relevant)

The template provides a solid foundation that matches the app's design system and user experience patterns.