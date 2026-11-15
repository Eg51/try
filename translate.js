const fs = require('fs');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');

const locales = ['ar', 'de', 'es', 'fr', 'ha', 'hi', 'ig', 'it', 'ja', 'nl', 'pt', 'sw', 'tr', 'yo', 'zh'];
const en = require('./messages/en.json');

async function translateObject(obj, lang) {
  const translatedObj = {};
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      translatedObj[key] = await translateObject(obj[key], lang);
    } else if (typeof obj[key] === 'string') {
      try {
        // 1. Protect variables like {tier} or {amount}
        const variables = [];
        let textToTranslate = obj[key].replace(/\{[^\}]+\}/g, (match) => {
          variables.push(match);
          return `___VAR${variables.length - 1}___`;
        });

        // 2. Translate
        const res = await translate(textToTranslate, { to: lang });
        let translatedText = res.text;

        // 3. Restore variables
        variables.forEach((variable, index) => {
          translatedText = translatedText.replace(`___VAR${index}___`, variable);
          // Sometimes Google adds spaces, so we clean it up just in case
          translatedText = translatedText.replace(`___VAR${index} ___`, variable);
          translatedText = translatedText.replace(`___VAR ${index}___`, variable);
        });
        
        translatedObj[key] = translatedText;
        
        // 4. Small delay to prevent Google from blocking your IP for spamming
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`❌ Error translating to ${lang} for key "${key}":`, error.message);
        translatedObj[key] = obj[key]; 
      }
    } else {
      translatedObj[key] = obj[key];
    }
  }
  return translatedObj;
}

async function run() {
  for (const lang of locales) {
    console.log(`\n🌍 Translating to: ${lang.toUpperCase()}...`);
    const translated = await translateObject(en, lang);
    
    fs.writeFileSync(
      path.join(__dirname, 'messages', `${lang}.json`),
      JSON.stringify(translated, null, 2)
    );
    console.log(`✅ Saved messages/${lang}.json`);
  }
  console.log('\n🎉 All languages translated!');
}

run();