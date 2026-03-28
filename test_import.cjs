const axios = require('axios');
const fs = require('fs');

async function test() {
  const data = JSON.parse(fs.readFileSync('./public/bulkArticles.json', 'utf8'));
  let success = 0;
  let errors = {};
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    item.published_at = new Date().toISOString();
    try {
      await axios.post('http://localhost:8000/api/django/cms/articles/', item);
      success++;
    } catch (e) {
      const errMsg = e.response && e.response.data ? JSON.stringify(e.response.data) : e.message;
      errors[errMsg] = (errors[errMsg] || 0) + 1;
    }
  }
  console.log(`Success: ${success}`);
  console.log('Errors:', errors);
}
test();
