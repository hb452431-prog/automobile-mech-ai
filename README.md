# Auto Aid Hub

Build a modern responsive website/web app named Automobile-Mech-AI for vehicle customers and mechanics. The website should look professional, simple, mobile-friendly, and easy to use. Use a clean automotive/mechanical theme with modern UI, cards, search bars, map section, AI help section, and dashboard forms.

Main Purpose

Automobile-Mech-AI is a platform that connects customers with nearby mechanics/garages and also provides AI-based vehicle problem diagnosis/help.

---

1) Authentication / First Screen

When a user opens the website for the first time, show a welcome/authentication page and ask them to log in or sign up using:

- Google account login

- Mobile number login with OTP verification

After successful login, immediately ask the user to choose their role:

- Mechanic

- Customer

Store the user role in the database so the user can directly go to their dashboard on the next login.

---

2) Role Selection Flow

A) If user selects “Mechanic”

Show a Mechanic Registration Form and save all data in the cloud database.

Mechanic form fields:

- Full Name

- Shop / Garage Name

- Shop Address

- City

- State

- PIN Code

- Mobile Number

- Alternate Number (optional)

- Services Offered (multi-select + custom input)

  - Bike repair

  - Car repair

  - Engine service

  - Oil change

  - Battery service

  - Tyre puncture / tyre replacement

  - Brake service

  - Electrical repair

  - AC repair

  - Emergency roadside help

  - Other

- Working Hours

- Years of Experience

- Garage Location on Map (auto-detect from address and allow manual pin drop)

- Profile Photo / Shop Photo (optional)

Mechanic dashboard should allow:

- Edit profile

- Update services

- Update garage address and map location

- Update phone number

- Toggle availability status: Open / Closed / Busy

- View customer requests (future-ready section)

- Save everything in cloud database

Use geolocation / geocoding so mechanic address can be used later for nearby search.

---

B) If user selects “Customer”

Show a Customer Registration Form and save all data in the cloud database.

Customer form fields:

- Full Name

- Registered Phone Number

- Vehicle Type

  - Bike

  - Car

  - Scooter

  - Other

- Vehicle Brand (optional)

- Vehicle Model (optional)

- Current Location access permission (optional but recommended for nearby garage search)

Customer dashboard / home should save:

- Name

- Registered phone number

- Vehicle details

- Search history

- AI help history (optional)

---

3) Home Page for Customer

After customer registration/login, open the Customer Home Page.

Top section:

- Website logo and name: Automobile-Mech-AI

- Navigation bar

- User profile icon

- Logout button

Main hero section:

- Search bar with placeholder text:

  “Search nearby garage / mechanic / service”

- Button: Find Nearby Garage

Search Functionality

When the customer searches:

- Use the customer current location if location permission is given

- Find nearby mechanics/garages from the mechanic database using the saved mechanic addresses / coordinates

- Show results in cards

- Each result card must display:

  - Mechanic / Garage Name

  - Mechanic Name

  - Full Garage Address

  - Phone Number

  - Services Offered

  - Open / Closed status

  - Approximate distance from customer

  - Button: Call Mechanic

  - Button: View on Map

  - Button: Get Directions

Map Integration

Below or beside the search results, show a live map with garage markers.

When the user clicks a garage:

- highlight the selected garage on the map

- show route / directions from customer location to mechanic location

- show estimated distance

- show address details

Use Google Maps or OpenStreetMap / Leaflet integration.

---

4) AI Help Section on Home Page

Below the garage search section, add a big section called:

AI Vehicle Help / AI Mechanic Assistant

This section should help customers understand vehicle issues.

AI Help input options:

Provide two ways for the customer to ask for help:

Option 1: Upload Image

- Allow customer to upload an image of the vehicle problem

  - broken part

  - warning light

  - tyre issue

  - engine issue

  - leakage

  - battery issue

  - wiring issue

  - brake issue

  - dashboard warning indicator

- After upload, AI should analyze the image and identify the possible problem.

Option 2: Describe the problem in text

Provide a text box with placeholder examples like:

- “Bike is not starting”

- “Car engine making noise”

- “Tyre puncture”

- “Battery draining quickly”

- “Smoke from engine”

- “Brake not working properly”

- “Oil leakage under vehicle”

Add a button:

Analyze Problem

---

5) AI Response Behavior

When the user uploads an image or describes a problem, the AI assistant should return a detailed step-by-step response in a helpful mechanic style.

AI output should include:

1. Possible problem name

2. Short explanation of what may be happening

3. Possible causes

4. Step-by-step checking process

5. Basic solution / troubleshooting steps

6. Safety precautions

7. What tools may be needed

8. Whether the user can fix it at home or not

9. Severity level

   - Low

   - Medium

   - High

10. Recommendation

- If it is a simple issue, explain the solution in detail

- If it is a serious / complicated / risky vehicle problem, show a warning like:

Example AI warning:

“This appears to be a serious or complex vehicle problem. It is safer to visit a nearby mechanic/garage instead of attempting repair yourself.”

Then show a button:

Search Nearby Garage

When clicked, it should automatically scroll to or open the nearby garage search section and show nearby mechanics.

---

6) AI Help Examples of Problems to Handle

The AI help module should be designed to handle common automobile problems like:

- Vehicle not starting

- Dead battery

- Engine overheating

- Tyre puncture

- Brake issue

- Oil leakage

- Engine warning light

- Smoke from exhaust

- Unusual engine noise

- Clutch issue

- Chain issue in bike

- Fuel leakage warning

- Headlight / indicator not working

- Spark plug issue

- Battery terminal corrosion

- Flat tyre

- Air filter issue

---

7) Mechanic Listing / Search Result UI

The nearby mechanic results should look clean and modern.

Each garage card should show:

- Garage image / mechanic avatar placeholder

- Garage name

- Mechanic name

- Address

- Mobile number

- Services tags

- Open/Closed badge

- Distance badge

- Buttons:

  - Call

  - Directions

  - View Details

View Details page/modal should show:

- Full mechanic profile

- Full garage address

- Services list

- Working hours

- Map location

- Contact number

- Experience

- Availability status

---

8) Cloud Database / Backend Requirements

Use a cloud backend and save all user data securely.

Required collections / tables:

Users

- userId

- role (mechanic/customer)

- name

- phone

- email

- authProvider

- createdAt

Mechanics

- mechanicId

- userId

- fullName

- garageName

- address

- city

- state

- pincode

- phone

- alternatePhone

- services

- experience

- workingHours

- locationCoordinates

- availabilityStatus

- profileImage

- createdAt

- updatedAt

Customers

- customerId

- userId

- fullName

- phone

- vehicleType

- vehicleBrand

- vehicleModel

- createdAt

AI Help Requests

- requestId

- userId

- imageUrl (optional)

- problemDescription

- aiResponse

- severity

- createdAt

Search History

- searchId

- customerId

- searchedLocation

- resultsShown

- createdAt

---

9) Suggested Tech Stack

Please build the website using a modern stack. Preferred stack:

- Frontend: React / Next.js with TypeScript

- Styling: Tailwind CSS + clean automotive UI

- Backend / Database / Auth: Firebase or Supabase

- Authentication: Google OAuth + Phone OTP

- Maps: Google Maps API or Leaflet / OpenStreetMap

- Image upload: cloud storage

- AI assistant integration: OpenAI API / multimodal AI support for image + text analysis

If easier, use Supabase for auth + DB and a maps API for location search.

---

10) Pages / Screens Needed

Build the following pages/screens:

1. Landing / Welcome Page

   

   - App intro

   - Login / Sign up with Google or Mobile OTP

2. Role Selection Page

   

   - Mechanic / Customer choice

3. Mechanic Registration Page

   

   - Full form

   - Save to cloud

4. Customer Registration Page

   

   - Full form

   - Save to cloud

5. Customer Home Page

   

   - Search nearby garage

   - Search results cards

   - Map with tracking

   - AI Help section

6. Mechanic Dashboard

   

   - Profile details

   - Edit services

   - Update availability

   - Update address/location

7. Garage Detail Modal / Page

   

   - Full garage information

   - Call and direction buttons

---

11) UI / UX Requirements

Use a clean, attractive automotive design.

Design style:

- Dark blue / black / white / orange mechanical theme

- Professional garage / automobile look

- Mobile responsive

- Clean cards

- Rounded inputs and buttons

- Smooth transitions

- Icons for services

- Map embedded nicely

- AI assistant section visually highlighted

Add these sections on landing page:

- Hero section

- “Find nearby mechanics instantly”

- “Get AI help for vehicle problems”

- “For mechanics: register your garage and get customers”

---

12) Important Functional Logic

Implement the following logic carefully:

Authentication logic

- First-time users must log in before using the platform

- After login, if no role exists, show role selection

- If role already exists, send user directly to their correct dashboard

Mechanic search logic

- Use saved mechanic addresses and coordinates

- Search by customer current location

- Sort garages by nearest distance first

- Show only mechanics with valid location and phone number

AI help logic

- If image or description suggests dangerous or advanced repair:

  - engine internal damage

  - brake failure

  - fuel leakage

  - major electrical issue

  - heavy smoke

  - overheating with coolant leak

    then clearly recommend going to a mechanic and show nearby garage CTA.

---

13) Add Demo Content / Seed Data

Add a few sample mechanic entries for testing so the nearby garage search can be demonstrated even before real mechanics register.

Example sample entries:

- Ravi Auto Garage

- City Bike Service Center

- Kumar Car Care

- FastFix Motors

Each should have sample address, services, and phone number.

---

14) Final Build Expectation

Generate a complete working website prototype for Automobile-Mech-AI with:

- authentication

- role-based onboarding

- mechanic/customer forms

- cloud data structure

- nearby garage search

- map tracking

- AI vehicle help section with image upload + text diagnosis

- serious issue detection and suggestion to search nearby garage

- responsive UI and modern design

Please create all pages, components, forms, database schema suggestions, and sample data needed to make this project functional and easy to continue developing.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a87b38d1-0da7-4835-912a-a56be0d1edbc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
