'use strict';

const cardContainer = document.querySelector('.card-body');
const mainQuestionsContainer = document.getElementById('main-questions');
let selectedAnswers = {}; // To store selected answers
let isChecked = false; // Flag to track if "Check" has been clicked

// Get the current location
const currentLocation = window.location.pathname;

console.log('Pathname:', currentLocation); // Pathname (relative path)

// Function to determine the endpoint
function getEndpoint(locationPath) {
  let endpoint;

  if (
    locationPath === '/xarici-dil' ||
    locationPath === '/xarici-dil.html' ||
    locationPath === '/SeidExam/xarici-dil.html'
  ) {
    endpoint = './xarici-dil.json';
  } else if (
    locationPath === '/information-technologies' ||
    locationPath === '/information-technologies.html' ||
    locationPath === '/SeidExam/information-technologies.html'
  ) {
    endpoint = './information-technologies.json';
  } else if (
    locationPath === '/it-esaslari' ||
    locationPath === '/it-esaslari.html' ||
    locationPath === '/SeidExam/it-esaslari.html'
  ) {
    endpoint = './it-esaslari.json';
  } else if (
    locationPath === '/az-dili' ||
    locationPath === '/az-dili.html' ||
    locationPath === '/SeidExam/az-dili.html'
  ) {
    endpoint = './az-dili.json';
  }

  return endpoint;
}

// Pass the pathname to the function and store the result
const endpoint = getEndpoint(currentLocation);

// Log the endpoint to verify the result
console.log('Endpoint:', endpoint);

const key = `questionStatuses-${currentLocation}`;
let questionStatuses = JSON.parse(localStorage.getItem(key)) || {};

fetch(endpoint)
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();
  })
  .then(data => {
    const randomQuestions = getRandomQuestions(data, 25);
    displayQuestions(randomQuestions);
    populateMainQuestions(data); // Populate question numbers
    displayQuestionStatuses(); // Fix: Pass the array
    addAnswerSelectionListeners(); // Add listeners after displaying questions
    // addCheckAnswersListener(randomQuestions); // Add listener for checking answers
  })
  .catch(error => {
    console.error('Error fetching the data:', error);
  });

// Function to get 25 random questions
function getRandomQuestions(data, count) {
  if (!Array.isArray(data)) {
    console.error('getRandomQuestions received non-array data:', data);
    return []; // Return an empty array to avoid errors
  }

  // Filter out questions that have already been answered correctly
  const filteredData = data.filter(question => {
    const questionNumber = question.questionNumber;
    return questionStatuses[questionNumber] !== 'correct'; // Exclude correct questions
  });

  // Shuffle the remaining questions
  const shuffled = filteredData.sort(() => 0.5 - Math.random());

  // If there aren't enough questions left, return all remaining questions
  return shuffled.slice(0, count);
}

// Function to populate #main-questions with buttons for each question number
function populateMainQuestions(data) {
  mainQuestionsContainer.innerHTML = ''; // Clear any existing content

  data.forEach(question => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline-secondary'; // Default button style

    let questionNumber = question.questionNumber.toString(); // Ensure it's a string

    // Apply spacing based on the length of the number
    if (questionNumber.length === 1) {
      button.innerHTML = `&nbsp;&nbsp;${questionNumber}&nbsp;&nbsp;`;
    } else if (questionNumber.length === 2) {
      button.innerHTML = `&nbsp;${questionNumber}&nbsp;`;
    } else {
      button.textContent = questionNumber; // Default case for longer numbers
    }

    mainQuestionsContainer.appendChild(button); // Add button to #main-questions
  });

  displayQuestionStatuses(); // Update button styles based on statuses
}

// Function to shuffle an array (Fisher-Yates shuffle algorithm)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to display questions in the card-body
function displayQuestions(questions) {
  cardContainer.innerHTML = ''; // Clear any existing content
  questions.forEach((question, index) => {
    // Create a copy of the answers array and shuffle it
    const shuffledAnswers = shuffleArray([...question.answers]);

    // Define fixed labels A, B, C, D, E
    const labels = ['A', 'B', 'C', 'D', 'E'];

    // Get the question number from the question object
    const questionNumber = question.questionNumber;

    // Check if this question's status is "incorrect" and apply the mark
    const wrongMark =
      questionStatuses[questionNumber] === 'incorrect'
        ? `<p class="card-title error-highlight"><mark>Səhv yazdığın sual.</mark></p>`
        : '';

    const questionHtml = `
      <div class="question-block">
        <h5 class="card-title">${index + 1}. ${question.questionUp}</h5>
        ${wrongMark}
        <p class="card-text">${question.questionDown}</p>
        <div class="list-group">
          ${shuffledAnswers
            .map((answer, answerIndex) => {
              const key = labels[answerIndex]; // Use fixed label for the current answer
              const value = Object.values(answer)[0]; // Get the answer text
              const isCorrect =
                Object.keys(answer)[0] === question.correctAnwser; // Check if it's the correct answer
              return `
              <button type="button" class="list-group-item list-group-item-action" 
                      data-question="${index}" 
                      data-answer="${key}" 
                      data-correct="${isCorrect}">
                ${key}. ${value}
              </button>`;
            })
            .join('')}
        </div>
        <div class="card-text text-end fs-6 display-6 text-white-50">
          ${question.questionNumber}
        </div>
        <hr />
      </div>
    `;
    cardContainer.innerHTML += questionHtml;
  });
}

// Function to display question statuses in #main-questions
function displayQuestionStatuses() {
  const questionButtons = mainQuestionsContainer.querySelectorAll('.btn');

  questionButtons.forEach(button => {
    const questionNumber = button.textContent.trim(); // Get the question number
    const status = questionStatuses[questionNumber] || 'default';
    let className;

    switch (status) {
      case 'correct':
        className = 'btn-success';
        break;
      case 'incorrect':
        className = 'btn-danger';
        break;
      case 'unanswered':
        className = 'btn-secondary';
        break;
      default:
        className = 'btn-outline-secondary'; // Default state
        break;
    }

    // Update the button's class
    button.className = `btn ${className}`;
  });
}

// Function to add answer selection listeners
function addAnswerSelectionListeners() {
  const answerButtons = document.querySelectorAll('.list-group-item');
  answerButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (isChecked) return; // Prevent selection if check has been performed

      const questionIndex = button.getAttribute('data-question');
      const answerKey = button.getAttribute('data-answer');

      // Check if the clicked button is already active
      if (button.classList.contains('active')) {
        // If already active, remove the active class and clear the selected answer
        button.classList.remove('active');
        delete selectedAnswers[questionIndex];
      } else {
        // Deselect previously selected answer for the same question
        document
          .querySelectorAll(
            `.list-group-item[data-question="${questionIndex}"]`
          )
          .forEach(btn => {
            btn.classList.remove('active');
          });

        // Mark the clicked button as selected
        button.classList.add('active');

        // Store selected answer
        selectedAnswers[questionIndex] = answerKey;
      }
    });
  });
}

document.getElementById('restartBtn').addEventListener('click', () => {
  window.location.reload(); // Simple page reload to restart
});

// Ensure the modal backdrop and modal-open class are properly removed when the modal is closed
document
  .getElementById('exampleModalCenter')
  .addEventListener('hidden.bs.modal', () => {
    document.body.classList.remove('modal-open'); // Remove the modal-open class
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove(); // Remove any remaining backdrop
    }
    document.body.style.overflow = ''; // Restore scrolling
  });

document
  .getElementById('exampleModalLong')
  .addEventListener('hidden.bs.modal', () => {
    document.body.classList.remove('modal-open'); // Remove the modal-open class
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.remove(); // Remove any remaining backdrop
    }
    document.body.style.overflow = ''; // Restore scrolling
  });

document.getElementById('checkAnswersBtn').addEventListener('click', () => {
  // Assuming the modal with id "exampleModalCenter" corresponds to the "Scrolling long content"
  const modal = new bootstrap.Modal(
    document.getElementById('exampleModalCenter')
  );
  modal.show();
});

// Add event listener for the "Check Answers" button
document
  .getElementById('checkAnswersBtn')
  .addEventListener('click', checkAnswers);

document.getElementById('doneExam').addEventListener('click', () => {
  // Assuming the modal with id "exampleModalCenter" corresponds to the "Scrolling long content"
  const modal = new bootstrap.Modal(
    document.getElementById('exampleModalLong')
  );
  modal.show();
});

document.getElementById('reset-button').addEventListener('click', () => {
  // Use currentLocation as a unique identifier for page-specific storage
  const key = `questionStatuses-${currentLocation}`;

  console.log(`Resetting localStorage for key: ${key}`);

  if (localStorage.getItem(key)) {
    localStorage.removeItem(key); // Remove the specific key for the current page
    console.log(`LocalStorage key "${key}" cleared.`);
  } else {
    console.log(`No data found for key: "${key}"`);
  }

  // Optionally reload the page to reflect the reset
  window.location.reload();
});

// Function to check answers and update statuses
function checkAnswers() {
  if (isChecked) return; // Prevent re-checking

  isChecked = true;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalPoint = 0;
  let pointMessage = '';

  document.getElementById('checkAnswersBtn').classList.remove('btn-warning');
  document.getElementById('checkAnswersBtn').classList.add('btn-info');
  document.getElementById('checkAnswersBtn').textContent = 'Answers';

  const questions = document.querySelectorAll('.question-block');
  questions.forEach((questionBlock, index) => {
    const questionNumber = questionBlock
      .querySelector('.card-text.text-end')
      .textContent.trim();
    const correctAnswer = questionBlock.getAttribute('data-correct-answer');
    const selectedButton = questionBlock.querySelector(
      '.list-group-item.active'
    );

    if (!selectedButton) {
      unansweredCount++;
      if (questionStatuses[questionNumber] !== 'incorrect') {
        questionStatuses[questionNumber] = 'unanswered';
      }

      // Highlight the correct answer
      questionBlock.querySelectorAll('.list-group-item').forEach(button => {
        if (button.getAttribute('data-correct') === 'true') {
          button.classList.add('should-select');
        }
      });
    } else if (selectedButton.getAttribute('data-correct') === 'true') {
      correctCount++;
      questionStatuses[questionNumber] = 'correct';
      selectedButton.classList.remove('active');
      selectedButton.classList.add('selected-correct');
    } else {
      incorrectCount++;
      questionStatuses[questionNumber] = 'incorrect';
      selectedButton.classList.remove('active');
      selectedButton.classList.add('selected-wrong');

      // Highlight the correct answer
      questionBlock.querySelectorAll('.list-group-item').forEach(button => {
        if (button.getAttribute('data-correct') === 'true') {
          button.classList.remove('active');
          button.classList.add('should-select');
        }
      });
    }
  });

  // Calculate total points and determine the result message
  totalPoint = correctCount * 2 + incorrectCount * -1;
  pointMessage =
    totalPoint > 0 && totalPoint < 17
      ? 'Kəsildin...'
      : totalPoint <= 0
      ? 'Kəsildin...'
      : 'Keçdin, təbriklər!';

  // Display results in the modal
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <hr>
    <p class="text-success">Düzlər: <span class="text-secondary">${correctCount}</span></p>
    <p class="text-danger">Səhvlər: <span class="text-secondary">${incorrectCount}</span></p>
    <p class="text-warning">Cavabsız: <span class="text-secondary">${unansweredCount}</span></p>
    <p class="text-info">Topladığı bal: <span class="text-secondary">${totalPoint} (${pointMessage})</span></p>
  `;

  // Save statuses to localStorage with the page-specific key
  localStorage.setItem(key, JSON.stringify(questionStatuses));
  displayQuestionStatuses();

  // Trigger the modal display
  const modal = new bootstrap.Modal(
    document.getElementById('exampleModalCenter')
  );
  modal.show();
}
