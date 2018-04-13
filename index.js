const easyimage = require('easyimage');
const fs = require('fs');
const google = require('google');
const screenshot = require('screenshot-desktop');
const Tesseract = require('tesseract.js');

if (!fs.existsSync('eng.traineddata')) {
  console.log('No language data present, download some from here:');
  console.log('https://github.com/tesseract-ocr/tessdata');
  console.log('');
  console.log('Hint; run this:');
  console.log(
    "curl -L 'https://github.com/tesseract-ocr/tessdata/raw/master/eng.traineddata' > eng.traineddata",
  );
  console.log('');
  process.exit(1);
}

const tesseract = Tesseract.create({
  langPath: 'eng.traineddata',
});

const start = Date.now();

// const readScreen = () => {
//   return screenshot({
//     filename: 'screenshot.png'
//   });
// };

const getTrainingImage = () => {
  return new Promise((resolve, reject) => {
    fs.readdir('training', (error, files) => {
      if (error) {
        reject(error);
      }

      // Get a random screenshot
      const file = files[Math.floor(Math.random() * files.length)];

      // Return its relative path
      resolve(`training/${file}`);
    });
  });
};

/**
 * TODO WET code
 */
const readQuestion = imagePath => {
  return new Promise((resolve, reject) => {
    easyimage
      .crop({ cropHeight: 566, cropWidth: 1035, src: imagePath, x: 45, y: 435 })
      .then(imageLike => {
        tesseract.recognize(imageLike.path, 'eng').then(result => {
          const text = result.text
            .split(/\n/)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

          resolve(text);
        });
      });
  });
};

/**
 * TODO WET code
 */
const readOption1 = imagePath => {
  return new Promise((resolve, reject) => {
    easyimage
      .crop({
        cropHeight: 172,
        cropWidth: 825,
        src: imagePath,
        x: 150,
        y: 1001,
      })
      .then(imageLike => {
        tesseract.recognize(imageLike.path, 'eng').then(result => {
          const text = result.text.replace(/\n/g, '').trim();

          resolve(text);
        });
      });
  });
};

/**
 * TODO WET code
 */
const readOption2 = imagePath => {
  return new Promise((resolve, reject) => {
    easyimage
      .crop({
        cropHeight: 172,
        cropWidth: 825,
        src: imagePath,
        x: 150,
        y: 1191,
      })
      .then(imageLike => {
        tesseract.recognize(imageLike.path, 'eng').then(result => {
          const text = result.text.replace(/\n/g, '').trim();

          resolve(text);
        });
      });
  });
};

/**
 * TODO WET code
 */
const readOption3 = imagePath => {
  return new Promise((resolve, reject) => {
    easyimage
      .crop({
        cropHeight: 172,
        cropWidth: 825,
        src: imagePath,
        x: 150,
        y: 1381,
      })
      .then(imageLike => {
        tesseract.recognize(imageLike.path, 'eng').then(result => {
          const text = result.text.replace(/\n/g, '').trim();

          resolve(text);
        });
      });
  });
};

const removePunctuation = string => {
  return string.replace(/[^a-zA-Z\s\d]/g, ' ');
};

const search = question => {
  return new Promise((resolve, reject) => {
    const text = removePunctuation(question.text.replace('NOT', '')).replace(
      /\s+/g,
      ' ',
    );

    google(text, (error, response) => {
      if (error) {
        reject(error);
      }

      let results = '';

      for (var i = 0; i < response.links.length; ++i) {
        var link = response.links[i];
        results += link.description;
      }

      resolve({ html: results, question });
    });
  });
};

const countInString = (needle = '', haystack = '') => {
  needle = String(needle);
  haystack = String(haystack);

  const re = new RegExp(needle, 'gim');

  try {
    return haystack.match(re).length;
  } catch (error) {
    return 0;
  }
};

const findAnswerOccurrences = data => {
  const html = data.html.toLowerCase();
  // TODO more WET code here
  const option1 = removePunctuation(data.question.option1)
    .replace(/\s+/, ' ')
    .trim();
  let option1Occurrences = html.split(option1).length - 1;
  option1.split(' ').forEach(part => {
    part = part.toLowerCase();
    option1Occurrences += countInString(part, html);
  });

  const option2 = removePunctuation(data.question.option2)
    .replace(/\s+/, ' ')
    .trim();
  let option2Occurrences = html.split(option2).length - 1;
  option2.split(' ').forEach(part => {
    part = part.toLowerCase();
    option2Occurrences += countInString(part, html);
  });

  const option3 = removePunctuation(data.question.option3)
    .replace(/\s+/, ' ')
    .trim();
  let option3Occurrences = html.split(option3).length - 1;
  option3.split(' ').forEach(part => {
    part = part.toLowerCase();
    option3Occurrences += countInString(part, html);
  });

  return {
    question: data.question.text,
    answers: [
      { text: data.question.option1, occurrences: option1Occurrences },
      { text: data.question.option2, occurrences: option2Occurrences },
      { text: data.question.option3, occurrences: option3Occurrences },
    ],
  };
};

const report = results => {
  let answers = results.answers;

  console.log('');
  console.log(`Question: ${results.question}`);
  console.log(
    `Option 1: ${results.answers[0].text} (${results.answers[0].occurrences})`,
  );
  console.log(
    `Option 2: ${results.answers[1].text} (${results.answers[1].occurrences})`,
  );
  console.log(
    `Option 3: ${results.answers[2].text} (${results.answers[2].occurrences})`,
  );

  answers = answers.sort((a, b) => {
    if (a.occurrences < b.occurrences) return 1;
    if (a.occurrences === b.occurrences) return 0;
    if (a.occurrences > b.occurrences) return -1;
  });

  if (results.question.indexOf(' NOT ') > 0) {
    answers = answers.reverse();
  }

  console.log('');
  console.log(`I think the answer is: ${answers[0].text}`);
  // console.log(`It occurred ${answers[0].occurrences} times`);
  console.log('');
  const end = Date.now();
  console.log(`Took ${(end - start) / 1000}s`);

  process.exit(0);
};

// readScreen()
getTrainingImage()
  .then(imagePath => {
    return new Promise((resolve, reject) => {
      // Read all texts in parallel
      Promise.all([
        readQuestion(imagePath),
        readOption1(imagePath),
        readOption2(imagePath),
        readOption3(imagePath),
      ]).then(texts => {
        resolve({
          text: texts[0],
          option1: texts[1],
          option2: texts[2],
          option3: texts[3],
        });
      });
    });
  })
  .then(search)
  .then(findAnswerOccurrences)
  .then(report)
  .catch(error => {
    console.log('Failed:\n', error);

    process.exit(1);
  });
