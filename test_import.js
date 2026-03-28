const axios = require('axios');
const fs = require('fs');

async function test() {
  const data = JSON.parse(fs.readFileSync('./public/bulkArticles.json', 'utf8'));
  let success = 0;
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    item.published_at = new Date().toISOString();
    try {
      await axios.post('http://localhost:8000/api/django/cms/articles/', item);
      success++;
      console.log(`Success ${success}: ${item.slug}`);
    } catch (e) {
      console.log(`Failed at index ${i} (${success} successes)`);
      console.log(e.response ? JSON.stringify(e.response.data) : e.message);
      break;
    }
  }
}
test();
