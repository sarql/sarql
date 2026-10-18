const fs = require('fs');
const path = require('path');
const { google } = require('d:/Coding/Sarql Profile page/backend/node_modules/googleapis');

const ROOT_FOLDER_ID = '1pGc3P82-V1Pf15TZUpPyVg3R928qvLnE';

async function syncDrive() {
  const saPath = path.join(__dirname, 'service-account.json');
  if (!fs.existsSync(saPath)) {
    console.error('service-account.json not found in scripts folder');
    return;
  }

  const SCOPES = ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive'];
  const auth = new google.auth.GoogleAuth({
    keyFile: saPath,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });

  console.log('🔄 Connecting to Google Drive (Projects-for-website: ' + ROOT_FOLDER_ID + ')...');

  const subfoldersRes = await drive.files.list({
    q: `'${ROOT_FOLDER_ID}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const subfolders = subfoldersRes.data.files || [];
  console.log(`Found ${subfolders.length} category folders.`);

  const categoryMap = {
    'Logos': { category: 'Logos', subCategory: 'Brand Mark', type: 'image' },
    'Posters': { category: 'Posters', subCategory: 'Visual Design', type: 'image' },
    'Branding': { category: 'Branding', subCategory: 'Identity System', type: 'image' },
    'Motion Graphics': { category: 'Motion Graphics', subCategory: 'Motion Design', type: 'video' },
    'Reels': { category: 'Reels', subCategory: 'Shortform Video', type: 'video' },
    'Social Media': { category: 'Social Media', subCategory: 'Social Content', type: 'image' },
    'Thumbnails': { category: 'Thumbnails', subCategory: 'Content Graphics', type: 'image' },
    'Video Editing': { category: 'Video Editing', subCategory: 'Cinematic Edit', type: 'video' },
  };

  const flagshipWeb = [
    {
      id: 'sarql-official',
      title: 'Sarql Official',
      category: 'Web Designs',
      subCategory: 'Social Media Web App',
      desc: 'High-performance web ecosystem featuring real-time messaging, media streaming, and modular design architecture.',
      tags: ['Modern UI/UX', 'Realtime Chat', 'Fast Loading'],
      url: 'https://sarql.com',
      type: 'web',
      featured: true,
    },
    {
      id: 'mylet-app',
      title: 'MyLet',
      category: 'Web Designs',
      subCategory: 'Property Rental Platform',
      desc: 'Modern real estate marketplace facilitating streamlined rental discoveries, automated booking workflows, and tenant management.',
      tags: ['Property Listings', 'User Dashboards', 'Search Filters'],
      url: 'https://mylet.in/',
      type: 'web',
    },
    {
      id: 'rashee-perfumes',
      title: 'Rashee Perfumes',
      category: 'Web Designs',
      subCategory: 'Luxury E-Commerce',
      desc: 'Boutique fragrance portal delivering a sensory digital storefront with real-time stock sync and bespoke visual presentation.',
      tags: ['Secure Checkout', 'Product Variants', 'Inventory Sync'],
      url: 'https://rasheeperfumes.com/',
      type: 'web',
    },
  ];

  const allProjects = [...flagshipWeb];

  for (const folder of subfolders) {
    if (folder.mimeType === 'application/vnd.google-apps.folder') {
      console.log(`📂 Scanning folder: ${folder.name}...`);
      const meta = categoryMap[folder.name] || { category: folder.name, subCategory: 'Digital Work', type: 'image' };
      
      let pageToken = null;
      let count = 0;

      do {
        const res = await drive.files.list({
          q: `'${folder.id}' in parents and trashed = false`,
          fields: 'nextPageToken, files(id, name, mimeType)',
          pageSize: 100,
          pageToken,
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        const files = res.data.files || [];
        files.forEach((f) => {
          const cleanTitle = f.name
            .replace(/^[0-9]+_/, '')
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .trim();

          const isVideo = f.mimeType && f.mimeType.startsWith('video');
          const finalType = isVideo ? 'video' : meta.type;

          allProjects.push({
            id: f.id,
            title: cleanTitle,
            category: meta.category,
            subCategory: meta.subCategory,
            driveId: f.id,
            imageUrl: 'https://drive.google.com/thumbnail?id=' + f.id + '&sz=w1000',
            videoUrl: 'https://drive.google.com/file/d/' + f.id + '/preview',
            type: finalType,
            desc: 'Professional ' + meta.category.toLowerCase() + ' crafted with high visual fidelity and brand precision.',
            tags: [meta.category, 'Sarql Original', 'HD Quality'],
          });
        });

        count += files.length;
        pageToken = res.data.nextPageToken;
      } while (pageToken);

      console.log(`   -> Loaded ${count} items for ${folder.name}`);
    }
  }

  const outPath = path.join(__dirname, '..', 'src', 'data', 'driveProjects.json');
  fs.writeFileSync(outPath, JSON.stringify(allProjects, null, 2));
  console.log(`✅ Success! Updated ${allProjects.length} projects in ${outPath}`);
}

syncDrive().catch((err) => {
  console.error('❌ Sync failed:', err.message);
});
