# Comet: Update Builder.io Settings for War Room

Please help me complete the Builder.io setup for War Room 3.0 by updating the Preview URL in Builder.io settings.

## What You Need to Do:

### 1. Log into Builder.io
- Go to https://builder.io
- Use the War Room account credentials
- You should see the "War Room Platform" space

### 2. Update the Preview URL
- Navigate to Settings → Space Settings (or Account → Space)
- Find the "Preview URL" field
- **Current value** (probably): Something with `fly.dev` or blank
- **Change it to**: `https://war-room-3-ui.onrender.com`
- Save the changes

### 3. Create a Test Page
- Go to Content section
- Click "New Entry" → "Page" 
- Set the URL path to: `/builder/test`
- Add a simple text block saying "Builder.io is working!"
- Click "Publish" in the top right

### 4. Verify It's Working
- Visit: https://war-room-3-ui.onrender.com/builder/test
- You should see "Builder.io is working!" 
- If you see "No content found", the page isn't published yet

## Why This is Needed:
The Preview URL tells Builder.io where your live site is deployed. Without the correct URL, Builder can't preview your changes or properly connect to your production site. We've already set up everything in the code - we just need Builder.io to know where to find it.

## Expected Result:
After these steps, you'll be able to:
- Visually edit pages in Builder.io
- See live previews of your changes
- Create and publish content that appears on the War Room site

## If You See Any Issues:
- Make sure the API key in Builder matches: `8686f311497044c0932b7d2247296478`
- Ensure the space name is "War Room Platform"
- Check that the site is live at https://war-room-3-ui.onrender.com

Please confirm when you've completed these steps and let me know if the test page is visible!