// -------------------- LeetCode --------------------
const codechefUsername = "vaj102005"; // <- Replace with your CodeChef username

function getSelectedDifficulty() {
  return localStorage.getItem("leetcodeDifficulty") || "MEDIUM";
}

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("difficulty");
  if (select) {
    select.value = getSelectedDifficulty();
    select.addEventListener("change", () => {
      localStorage.setItem("leetcodeDifficulty", select.value);
      getLeetCodeQuestion(); // re-fetch with new selection
    });
  }

  // Load questions on popup open
  getLeetCodeQuestion();
  getUnsolvedProblem(codeforcesHandle);
  getCodeChefQuestion(codechefUsername);
});

async function getLeetCodeQuestion() {
  const query = `
    query questionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        questions: data {
          title
          titleSlug
          difficulty
          topicTags {
            name
            slug
          }
        }
      }
    }
  `;

  const difficulty = getSelectedDifficulty();

  const variables = {
    categorySlug: "",
    skip: 0,
    limit: 100,
    filters: {
      difficulty: difficulty
      // 👇 remove tags here to avoid API filtering bugs
    }
  };

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();
    const allQuestions = json.data.problemsetQuestionList.questions;

    // ✅ Filter DSA tags manually after receiving
    const dsaTags = new Set(["arrays", "dynamic-programming", "graph", "tree", "linked-list", "stack", "queue"]);

    const filtered = allQuestions.filter(q =>
      q.topicTags.some(tag => dsaTags.has(tag.slug))
    );

    if (filtered.length === 0) {
      document.getElementById("leetcode").innerText = `No ${difficulty} DSA questions found.`;
      return;
    }

    const random = filtered[Math.floor(Math.random() * filtered.length)];
    const link = `https://leetcode.com/problems/${random.titleSlug}/`;

    document.getElementById("leetcode").innerHTML = `<a href="${link}" target="_blank">${random.title} (${random.difficulty})</a>`;
  } catch (error) {
    document.getElementById("leetcode").innerText = "LeetCode fetch failed.";
    console.error("LeetCode error:", error);
  }
}


// -------------------- Codeforces --------------------

const codeforcesHandle = "tourist"; // Change this to your Codeforces handle

async function getSolvedProblems(handle) {
  const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
  const data = await response.json();
  const solved = new Set();

  if (data.status === "OK" && Array.isArray(data.result)) {
    data.result.forEach(sub => {
      if (sub.verdict === "OK") {
        const key = `${sub.problem.contestId}-${sub.problem.index}`;
        solved.add(key);
      }
    });
  }

  return solved;
}

async function getUnsolvedProblem(handle) {
  const solved = await getSolvedProblems(handle);

  const response = await fetch("https://codeforces.com/api/problemset.problems");
  const data = await response.json();
  if (data.status !== "OK") {
    document.getElementById("codeforces").innerText = "Failed to fetch Codeforces questions.";
    return;
  }

  const allProblems = data.result.problems;
  const unsolved = allProblems.filter(p => {
    const key = `${p.contestId}-${p.index}`;
    return (
      !solved.has(key) &&
      p.rating !== undefined &&
      p.rating >= 800 &&
      p.rating <= 1000
    );
  });

  if (unsolved.length === 0) {
    document.getElementById("codeforces").innerText = "No suitable Codeforces problems found.";
    return;
  }

  const random = unsolved[Math.floor(Math.random() * unsolved.length)];
  const link = `https://codeforces.com/problemset/problem/${random.contestId}/${random.index}`;
  document.getElementById("codeforces").innerHTML = `<a href="${link}" target="_blank">${random.name} (${random.rating})</a>`;
}



async function getCodeChefSolvedProblems(username) {
  try {
    const response = await fetch(`https://www.codechef.com/users/${username}`);
    const html = await response.text();

    const solved = new Set();
    const practiceSection = html.match(/<section class='rating-data-section problems-solved'>[\s\S]*?<\/section>/);
    if (!practiceSection) return solved;

    const matches = practiceSection[0].match(/\/problems\/([A-Z0-9_]+)/g);
    if (matches) {
      matches.forEach(link => {
        const code = link.split("/").pop();
        solved.add(code);
      });
    }

    return solved;
  } catch (err) {
    console.error("CodeChef solved parse failed:", err);
    return new Set();
  }
}


async function getCodeChefQuestion(username) {
  try {
    const solved = await getCodeChefSolvedProblems(username);

    const response = await fetch('codechef_problems.json'); // Local JSON
    const data = await response.json();

    // Filter unsolved problems with difficulty ≥ 1000
    const unsolved = data.filter(q =>
      !solved.has(q.problemCode) && q.difficultyRating >= 1000
    );

    if (unsolved.length === 0) {
      document.getElementById("codechef").innerText = "No suitable CodeChef problems found.";
      return;
    }

    const random = unsolved[Math.floor(Math.random() * unsolved.length)];
    const link = `https://www.codechef.com/problems/${random.problemCode}`;

    document.getElementById("codechef").innerHTML = `
      <a href="${link}" target="_blank">${random.problemName} (${random.difficultyRating})</a>
    `;
  } catch (error) {
    console.error("CodeChef Local JSON error:", error);
    document.getElementById("codechef").innerText = "Failed to load CodeChef question.";
  }
}


// Theme toggle logic
const toggle = document.getElementById("themeToggle");
const isDark = localStorage.getItem("theme") === "dark";

if (isDark) document.body.classList.add("dark");
toggle.checked = isDark;

toggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});





