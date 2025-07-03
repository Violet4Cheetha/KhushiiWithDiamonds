
# Khushii With Diamond

## About the project 

### Jewellery web catalog with 
- Dynamic price change according to live gold prices
- Seamless database integration for storing and retrieving data.
- Automatically uploads images to Google Drive along with relevant information, enabling centralized photo collection.

## Built With

* [![Tailwind CSS][tailwind-img]][tailwind-url]

* [![React Hooks][reacthooks-img]][reacthooks-url]

* [![Supabase][supabase-img]][supabase-url]

* [![Lucide React][lucide-img]][lucide-url]

* [![HTML5][html-img]][html-url]

* [![TypeScript][ts-img]][ts-url]

* [![Vite][vite-img]][vite-url]

* [![Node.js][node-img]][node-url]

* [![GitHub Actions][gha-img]][gha-url]

## Getting Started

### Prerequisites

- Supabase account

    [![Supabase][supabase-img]][supabase-url]

- npm (if you want to run locally)

```sh
  npm install npm@latest -g
```

- A web hosting platform (if you want to deploy your project online).
    
    You can choose any hosting provider, but I will demonstrate how to deploy it using Netlify and Hostinger

    [![Netlify][netlify-img]][netlify-url]

    [![Hostinger][hostinger-img]][hostinger-url]

### Supabase SQL Code

- Create a new database at Supabase and get its URL and Key.

- Run the [Final_sql](https://github.com/Violet4Cheetha/KhushiiWithDiamonds/blob/main/supabase/Final_sql.sql) code in its SQL tab.

-Your SQL database should now have jewellery_item,categories and admin_setting tables.

-Create [upload-to-drive](https://github.com/Violet4Cheetha/KhushiiWithDiamonds/blob/main/supabase/upload-to-drive/index.ts) and [delete-from-drive](https://github.com/Violet4Cheetha/KhushiiWithDiamonds/blob/77f52deda1c795d6a22cfd53c8a6e67f51b6dfb4/supabase/delete-from-drive/index.ts)

-

### Installation (To run locally)

1. Clone the repo

```
git clone https://github.com/Violet4Cheetha/KhushiiWithDiamonds.git
```

2. Change git remote url to avoid accidental pushes to base project

```
git remote set-url https://github.com/Violet4Cheetha/KhushiiWithDiamonds
git remote -v # confirm the changes
```

3. Install NPM packages

```
npm install
```

4. Get a free live gold price API key at [https://metalpriceapi.com/](https://metalpriceapi.com/).

5. Create .env and enter your Enviromental Variables in .env

```
VITE_SUPABASE_DATABASE_URL={your supabase url}
VITE_SUPABASE_ANON_KEY={your supabase key}
VITE_GOLD_API_KEY={your metalpriceapi key}
```


    


[netlify-img]: https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white
[netlify-url]: https://www.netlify.com/

[hostinger-img]: https://img.shields.io/badge/Hostinger-673DE6?style=for-the-badge&logo=hostinger&logoColor=white
[hostinger-url]: https://www.hostinger.com/

[tailwind-img]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[tailwind-url]: https://tailwindcss.com/

[reacthooks-img]: https://img.shields.io/badge/React_Hooks-61DAFB?style=for-the-badge&logo=react&logoColor=black
[reacthooks-url]: https://reactjs.org/docs/hooks-intro.html

[supabase-img]: https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white
[supabase-url]: https://supabase.com/

[lucide-img]: https://img.shields.io/badge/Lucide_React-000000?style=for-the-badge&logo=lucide&logoColor=white
[lucide-url]: https://lucide.dev/

[html-img]: https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white
[html-url]: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5

[ts-img]: https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white
[ts-url]: https://www.typescriptlang.org/

[vite-img]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[vite-url]: https://vitejs.dev/

[node-img]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[node-url]: https://nodejs.org/

[gha-img]: https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white
[gha-url]: https://github.com/features/actions

