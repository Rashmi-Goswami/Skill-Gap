
import { supabase } from "./supabaseClient.js";

"use strict";

/* =========================================
   SKILLGAP — SKILL MATCHING ENGINE
========================================= */

const STORAGE_KEY = "skillgapRecentAnalyses";
const MAX_HISTORY = 5;

const skillList = [
  { name: "C++", aliases: ["c++", "cpp"] },
  { name: "C", aliases: ["c language"] },
  { name: "Java", aliases: ["java"] },
  { name: "Python", aliases: ["python", "py"] },
  { name: "JavaScript", aliases: ["javascript", "js"] },
  { name: "TypeScript", aliases: ["typescript", "ts"] },
  { name: "HTML", aliases: ["html"] },
  { name: "CSS", aliases: ["css"] },
  { name: "React", aliases: ["react", "react.js", "reactjs"] },
  { name: "Node.js", aliases: ["node.js", "nodejs", "node js"] },
  { name: "Express", aliases: ["express.js", "expressjs", "express"] },
  { name: "SQL", aliases: ["sql"] },
  { name: "MySQL", aliases: ["mysql"] },
  { name: "PostgreSQL", aliases: ["postgresql", "postgres"] },
  { name: "MongoDB", aliases: ["mongodb", "mongo db"] },
  { name: "Git", aliases: ["git"] },
  { name: "GitHub", aliases: ["github", "git hub"] },
  {
    name: "Data Structures and Algorithms",
    aliases: [
      "data structures and algorithms",
      "data structures",
      "algorithms",
      "dsa"
    ]
  },
  {
    name: "Object-Oriented Programming",
    aliases: [
      "object-oriented programming",
      "object oriented programming",
      "oop",
      "oops"
    ]
  },
  { name: "DBMS", aliases: ["dbms", "database management"] },
  {
    name: "Operating Systems",
    aliases: ["operating systems", "operating system", "os concepts"]
  },
  {
    name: "Computer Networks",
    aliases: ["computer networks", "computer network", "networking"]
  },
  { name: "REST API", aliases: ["rest api", "restful api", "rest apis"] },
  { name: "API", aliases: ["apis", "api"] },
  { name: "Docker", aliases: ["docker"] },
  { name: "Kubernetes", aliases: ["kubernetes", "k8s"] },
  { name: "AWS", aliases: ["aws", "amazon web services"] },
  { name: "Azure", aliases: ["azure", "microsoft azure"] },
  { name: "Google Cloud", aliases: ["google cloud", "gcp"] },
  { name: "Linux", aliases: ["linux"] },
  { name: "Machine Learning", aliases: ["machine learning", "ml"] },
  {
    name: "Artificial Intelligence",
    aliases: ["artificial intelligence", "ai"]
  },
  { name: "Deep Learning", aliases: ["deep learning"] },
  { name: "Pandas", aliases: ["pandas"] },
  { name: "NumPy", aliases: ["numpy"] },
  { name: "TensorFlow", aliases: ["tensorflow"] },
  { name: "PyTorch", aliases: ["pytorch"] },
  { name: "Figma", aliases: ["figma"] },
  { name: "Agile", aliases: ["agile"] },
  { name: "Unit Testing", aliases: ["unit testing", "unit tests"] },
  { name: "Jest", aliases: ["jest"] },
  {
    name: "Communication",
    aliases: ["communication", "communication skills"]
  },
  {
    name: "Problem Solving",
    aliases: ["problem solving", "problem-solving"]
  },
  { name: "System Design", aliases: ["system design"] },
  { name: "Data Analysis", aliases: ["data analysis", "data analytics"] },
  { name: "Excel", aliases: ["excel", "microsoft excel"] },
  { name: "Power BI", aliases: ["power bi"] },
  { name: "Tableau", aliases: ["tableau"] },
  { name: "PHP", aliases: ["php"] },
  { name: "Swift", aliases: ["swift"] },
  { name: "Kotlin", aliases: ["kotlin"] },
  { name: "Flutter", aliases: ["flutter"] },
  {
    name: "Android Development",
    aliases: ["android development", "android sdk"]
  },
  {
    name: "Cybersecurity",
    aliases: ["cybersecurity", "cyber security"]
  }
];

const optionalPhrases = [
  "nice to have",
  "nice-to-have",
  "preferred",
  "optional",
  "bonus",
  "not required",
  "not necessary",
  "a plus",
  "would be a plus",
  "ideally",
  "desirable",
  "good to have"
];

const requiredPhrases = [
  "required",
  "must have",
  "must-have",
  "minimum qualification",
  "minimum qualifications",
  "essential",
  "mandatory",
  "we require",
  "requirements",
  "proficiency in",
  "experience with"
];

/* =========================================
   CONNECT HTML ELEMENTS
========================================= */

const form = document.getElementById("analysisForm");
const jobTitleInput = document.getElementById("jobTitle");
const studentSkillsInput = document.getElementById("studentSkills");
const customSkillsInput = document.getElementById("customSkills");
const jobDescriptionInput = document.getElementById("jobDescription");

const messageBox = document.getElementById("message");
const emptyState = document.getElementById("emptyState");
const reportContent = document.getElementById("reportContent");
const historyList = document.getElementById("historyList");

const copyButton = document.getElementById("copyButton");
const downloadButton = document.getElementById("downloadButton");

const authEmailInput = document.getElementById("authEmail");
const authPasswordInput = document.getElementById("authPassword");
const authStatus = document.getElementById("authStatus");
const authMessage = document.getElementById("authMessage");

const signUpButton = document.getElementById("signUpButton");
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");

let lastReport = null;
let currentUser = null;

/* =========================================
   TEXT AND MATCHING HELPERS
========================================= */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return replacements[character];
  });
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAlias(text, alias) {
  const normalizedText = normalizeText(text);
  const normalizedAlias = normalizeText(alias);

  if (!normalizedAlias) {
    return false;
  }

  const escapedAlias = escapeRegex(normalizedAlias);
  const startsWithWord = /^[a-z0-9]/i.test(normalizedAlias);
  const endsWithWord = /[a-z0-9]$/i.test(normalizedAlias);

  const pattern =
    (startsWithWord ? "\\b" : "") +
    escapedAlias +
    (endsWithWord ? "\\b" : "");

  return new RegExp(pattern, "i").test(normalizedText);
}

function splitCustomSkills(customText) {
  const items = String(customText || "")
    .split(/[,\n;]+/)
    .map(function (item) {
      return item.trim();
    })
    .filter(Boolean);

  return items.filter(function (item, index) {
    return items.findIndex(function (other) {
      return other.toLowerCase() === item.toLowerCase();
    }) === index;
  });
}

function extractAllSkills(text, customNames) {
  const found = [];

  skillList.forEach(function (skill) {
    const hasMatch = skill.aliases.some(function (alias) {
      return matchesAlias(text, alias);
    });

    if (hasMatch) {
      found.push(skill.name);
    }
  });

  (customNames || []).forEach(function (skillName) {
    const hasMatch = matchesAlias(text, skillName);

    const alreadyFound = found.some(function (item) {
      return item.toLowerCase() === skillName.toLowerCase();
    });

    if (hasMatch && !alreadyFound) {
      found.push(skillName);
    }
  });

  return found;
}

function splitIntoSentences(text) {
  return String(text || "")
    .split(/[.!?;\n]+/)
    .map(function (part) {
      return part.trim();
    })
    .filter(Boolean);
}

/* =========================================
   REQUIRED VS OPTIONAL CLASSIFICATION
========================================= */

function isOptionalSkill(text, skillName) {
  const builtIn = skillList.find(function (skill) {
    return skill.name.toLowerCase() === skillName.toLowerCase();
  });

  const aliases = builtIn ? builtIn.aliases : [skillName];
  const sentences = splitIntoSentences(text);

  return sentences.some(function (sentence) {
    const skillMentioned = aliases.some(function (alias) {
      return matchesAlias(sentence, alias);
    });

    if (!skillMentioned) {
      return false;
    }

    const lowerSentence = normalizeText(sentence);

    const hasOptionalPhrase = optionalPhrases.some(function (phrase) {
      return lowerSentence.includes(phrase);
    });

    const hasRequiredPhrase = requiredPhrases.some(function (phrase) {
      return lowerSentence.includes(phrase);
    });

    return hasOptionalPhrase && !hasRequiredPhrase;
  });
}

/* =========================================
   MESSAGES AND LOCAL STORAGE
========================================= */

function showMessage(message, isSuccess) {
  messageBox.textContent = message;
  messageBox.classList.toggle("success", Boolean(isSuccess));
  messageBox.hidden = !message;
}

function clearMessage() {
  messageBox.textContent = "";
  messageBox.hidden = true;
  messageBox.classList.remove("success");
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_HISTORY))
    );
  } catch (error) {
    console.error("Could not save local history:", error);
  }
}

/* =========================================
   ACCOUNT AND AUTHENTICATION
========================================= */

function updateAuthUI() {
  const signedIn = Boolean(currentUser);

  authStatus.textContent = signedIn
    ? `Signed in as ${currentUser.email}. New reports can be saved online.`
    : "Sign in or create an account to save reports online.";

  signUpButton.hidden = signedIn;
  signInButton.hidden = signedIn;
  signOutButton.hidden = !signedIn;

  authEmailInput.disabled = signedIn;
  authPasswordInput.disabled = signedIn;
}

function setAuthMessage(message) {
  authMessage.textContent = message;
}

async function refreshAuthState() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    setAuthMessage("Could not check login: " + error.message);
    return;
  }

  currentUser = data.session?.user ?? null;
  updateAuthUI();
  await renderHistory();
}

async function signUp() {
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;

  if (!email || password.length < 6) {
    setAuthMessage(
      "Enter a valid email and a password of at least 6 characters."
    );
    return;
  }

  setAuthMessage("Creating your account...");

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    setAuthMessage("Sign-up failed: " + error.message);
    return;
  }

  if (data.session) {
    currentUser = data.session.user;
    updateAuthUI();
    await renderHistory();
    setAuthMessage("Account created and signed in successfully.");
  } else {
    setAuthMessage(
      "Account created. Check your email for a confirmation link, then sign in."
    );
  }
}

async function signIn() {
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;

  if (!email || !password) {
    setAuthMessage("Enter your email and password.");
    return;
  }

  setAuthMessage("Signing in...");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    setAuthMessage("Sign-in failed: " + error.message);
    return;
  }

  currentUser = data.user;
  updateAuthUI();
  await renderHistory();
  setAuthMessage("Signed in successfully.");
}

async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    setAuthMessage("Sign-out failed: " + error.message);
    return;
  }

  currentUser = null;
  updateAuthUI();
  await renderHistory();
  setAuthMessage("You have signed out.");
}

/* =========================================
   MAIN ANALYSIS
========================================= */

async function analyzeSkills(event) {
  if (event) {
    event.preventDefault();
  }

  clearMessage();

  const jobTitle = jobTitleInput.value.trim();
  const studentText = studentSkillsInput.value.trim();
  const jobText = jobDescriptionInput.value.trim();
  const customNames = splitCustomSkills(customSkillsInput.value);

  if (!jobTitle || !studentText || !jobText) {
    showMessage(
      "Please fill in the target role, your current skills, and the job description.",
      false
    );
    return;
  }

  if (jobText.length < 15) {
    showMessage(
      "Please paste a little more of the job description before analyzing.",
      false
    );
    return;
  }

  const student = extractAllSkills(studentText, customNames);
  const allJobSkills = extractAllSkills(jobText, customNames);

  if (student.length === 0) {
    showMessage(
      "No supported skills were recognized in your skills input. Try known terms such as C++, Python, HTML, CSS, or Git.",
      false
    );
    return;
  }

  if (allJobSkills.length === 0) {
    showMessage(
      "No supported skills were recognized in the job description. Add terms under Additional skills to recognize, or paste a more detailed description.",
      false
    );
    return;
  }

  const optional = allJobSkills.filter(function (skill) {
    return isOptionalSkill(jobText, skill);
  });

  const required = allJobSkills.filter(function (skill) {
    return !isOptionalSkill(jobText, skill);
  });

  const matched = required.filter(function (skill) {
    return student.some(function (owned) {
      return owned.toLowerCase() === skill.toLowerCase();
    });
  });

  const missing = required.filter(function (skill) {
    return !student.some(function (owned) {
      return owned.toLowerCase() === skill.toLowerCase();
    });
  });

  const optionalMatched = optional.filter(function (skill) {
    return student.some(function (owned) {
      return owned.toLowerCase() === skill.toLowerCase();
    });
  });

  const score = required.length === 0
    ? 0
    : Math.round((matched.length / required.length) * 100);

  const report = {
    id: Date.now(),
    jobTitle: jobTitle,
    createdAt: new Date().toLocaleString(),
    studentSkills: student,
    required: required,
    optional: optional,
    matched: matched,
    missing: missing,
    optionalMatched: optionalMatched,
    score: score
  };

  lastReport = report;

  renderReport(report);

  copyButton.disabled = false;
  downloadButton.disabled = false;

  const saved = await saveReportToHistory(report);

  if (saved) {
    showMessage(
      "Analysis complete and saved to your Supabase account.",
      true
    );
  } else if (!currentUser) {
    showMessage(
      "Analysis complete. Sign in to save this report online.",
      false
    );
  }

  document.getElementById("results").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* =========================================
   REPORT AND LEARNING ROADMAP
========================================= */

function renderSkillTags(skills, emptyText) {
  if (!skills.length) {
    return "<p>" + escapeHTML(emptyText) + "</p>";
  }

  return '<div class="skill-list">' +
    skills.map(function (skill) {
      return '<span class="skill-tag">' + escapeHTML(skill) + "</span>";
    }).join("") +
    "</div>";
}

function getRoadmap(missing) {
  if (!missing.length) {
    return [{
      title: "Strengthen what you already know",
      detail:
        "Build a small project that demonstrates the listed requirements. Practise explaining your design decisions and trade-offs."
    }];
  }

  return missing.slice(0, 5).map(function (skill, index) {
    let detail;

    if (index === 0) {
      detail =
        "Start with the fundamentals, then complete one small hands-on exercise. Write down what you learned.";
    } else {
      detail =
        "After your earlier learning steps, study " + skill +
        " through a tutorial and build a small example you can explain.";
    }

    return {
      title: "Learn " + skill,
      detail: detail
    };
  });
}

function renderReport(report) {
  emptyState.hidden = true;
  reportContent.hidden = false;

  const roadmap = getRoadmap(report.missing);

  reportContent.innerHTML = `
    <div class="report-header">
      <div>
        <p class="eyebrow">ANALYSIS COMPLETE</p>
        <h3>${escapeHTML(report.jobTitle)}</h3>
        <p>Created ${escapeHTML(report.createdAt)}</p>
      </div>

      <div>
        <div class="score-circle">${report.score}%</div>
        <div class="score-caption">required-skill overlap</div>
      </div>
    </div>

    <div class="metric-grid">
      <div class="metric">
        <span class="metric-value">${report.matched.length}</span>
        <span class="metric-label">Required skills matched</span>
      </div>

      <div class="metric">
        <span class="metric-value">${report.missing.length}</span>
        <span class="metric-label">Required skills to learn</span>
      </div>

      <div class="metric">
        <span class="metric-value">${report.optional.length}</span>
        <span class="metric-label">Optional skills detected</span>
      </div>
    </div>

    <div class="report-section">
      <h3>Skill breakdown</h3>

      <div class="skill-columns">
        <div class="skill-column matched">
          <h4>✓ Required skills you listed</h4>
          ${renderSkillTags(report.matched, "No required skills matched yet.")}
        </div>

        <div class="skill-column missing">
          <h4>↗ Required skills to work on</h4>
          ${renderSkillTags(report.missing, "No missing required skills detected.")}
        </div>

        <div class="skill-column optional">
          <h4>✦ Optional skills</h4>
          ${renderSkillTags(report.optional, "No optional skills identified by the wording rules.")}
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3>Your suggested learning roadmap</h3>

      <div class="roadmap-list">
        ${roadmap.map(function (item, index) {
          return `
            <div class="roadmap-item">
              <span class="roadmap-number">${String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>${escapeHTML(item.title)}</strong>
                <p>${escapeHTML(item.detail)}</p>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>

    <div class="disclaimer">
      <strong>How to read this score:</strong>
      it is the percentage of recognized required skill names that also appeared
      in your current-skills input. It does not measure skill depth, interview
      performance, experience, or probability of getting hired. Optional skills
      are detected using simple phrase rules and may need manual review.
    </div>
  `;
}

/* =========================================
   COPY AND DOWNLOAD
========================================= */

function buildSummary(report) {
  return [
    "SkillGap Report — " + report.jobTitle,
    "Created: " + report.createdAt,
    "Required-skill overlap: " + report.score + "%",
    "Required skills matched: " + (report.matched.join(", ") || "None"),
    "Required skills to learn: " + (report.missing.join(", ") || "None"),
    "Optional skills detected: " + (report.optional.join(", ") || "None"),
    "",
    "Suggested learning roadmap:",
    ...getRoadmap(report.missing).map(function (item, index) {
      return (index + 1) + ". " + item.title + " — " + item.detail;
    }),
    "",
    "Note: This is a rule-based skill-term comparison, not a hiring prediction."
  ].join("\n");
}

async function copyReport() {
  if (!lastReport) return;

  const summary = buildSummary(lastReport);

  try {
    await navigator.clipboard.writeText(summary);
    showMessage("Report summary copied to clipboard.", true);
  } catch (error) {
    const temporary = document.createElement("textarea");
    temporary.value = summary;
    temporary.setAttribute("readonly", "");
    temporary.style.position = "fixed";
    temporary.style.opacity = "0";

    document.body.appendChild(temporary);
    temporary.select();

    let copied = false;

    try {
      copied = document.execCommand("copy");
    } catch (copyError) {
      copied = false;
    }

    temporary.remove();

    showMessage(
      copied
        ? "Report summary copied to clipboard."
        : "Clipboard access was blocked. Try downloading the report instead.",
      copied
    );
  }
}

function downloadReport() {
  if (!lastReport) return;

  const blob = new Blob(
    [buildSummary(lastReport)],
    { type: "text/plain;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "SkillGap-report.txt";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/* =========================================
   RECENT ANALYSES — SUPABASE
========================================= */

async function saveReportToHistory(report) {
  // Keep the report in this browser even if the user isn't signed in.
  const localHistory = loadHistory();

  localHistory.unshift({
    id: report.id,
    jobTitle: report.jobTitle,
    createdAt: report.createdAt,
    score: report.score,
    matchedCount: report.matched.length,
    missingCount: report.missing.length
  });

  saveHistory(localHistory);

  if (!currentUser) {
    await renderHistory();
    return false;
  }

  const { error } = await supabase
    .from("analyses")
    .insert({
      user_id: currentUser.id,
      job_title: report.jobTitle,
      score: report.score,
      matched_skills: report.matched,
      missing_skills: report.missing,
      student_skills: report.studentSkills
    });

  if (error) {
    console.error("Supabase save error:", error);
    await renderHistory();
    showMessage(
      "Report generated, but online saving failed: " + error.message,
      false
    );
    return false;
  }

  await renderHistory();
  return true;
}

async function renderHistory() {
  let onlineHistory = [];

  if (currentUser) {
    const { data, error } = await supabase
      .from("analyses")
      .select(
        "id, job_title, created_at, score, matched_skills, missing_skills"
      )
      .order("created_at", { ascending: false })
      .limit(MAX_HISTORY);

    if (error) {
      console.error("Supabase history error:", error);
      historyList.innerHTML =
        '<p class="history-empty">Could not load online history: ' +
        escapeHTML(error.message) +
        "</p>";
      return;
    }

    onlineHistory = data || [];
  }

  const oldLocalHistory = loadHistory();

  const onlineHTML = onlineHistory.map(function (item) {
    const createdAt = item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "Saved analysis";

    const matchedCount = Array.isArray(item.matched_skills)
      ? item.matched_skills.length
      : 0;

    const missingCount = Array.isArray(item.missing_skills)
      ? item.missing_skills.length
      : 0;

    return `
      <article class="history-item">
        <div>
          <h3>${escapeHTML(item.job_title || "Untitled role")}</h3>
          <p>
            ${escapeHTML(createdAt)}
            · ${matchedCount} matched
            · ${missingCount} to learn
            · Saved online
          </p>
        </div>
        <span class="history-score">${Number(item.score) || 0}%</span>
      </article>
    `;
  }).join("");

  const localHTML = oldLocalHistory.map(function (item) {
    return `
      <article class="history-item">
        <div>
          <h3>${escapeHTML(item.jobTitle || "Untitled role")}</h3>
          <p>
            ${escapeHTML(item.createdAt || "Saved analysis")}
            · ${Number(item.matchedCount) || 0} matched
            · ${Number(item.missingCount) || 0} to learn
            · Saved in this browser
          </p>
        </div>
        <span class="history-score">${Number(item.score) || 0}%</span>
      </article>
    `;
  }).join("");

  if (!onlineHTML && !localHTML) {
    historyList.innerHTML = currentUser
      ? '<p class="history-empty">No saved analyses yet. Run your first analysis!</p>'
      : '<p class="history-empty">Sign in to save analyses online. Your older browser history will appear here if available.</p>';
    return;
  }

  historyList.innerHTML = onlineHTML + localHTML;
}

/* =========================================
   FORM BUTTONS
========================================= */

function clearForm() {
  form.reset();
  clearMessage();
  jobTitleInput.focus();
}

function loadDemo() {
  jobTitleInput.value = "Software Engineer Intern";

  studentSkillsInput.value =
    "C++, DSA, HTML, CSS, Git, GitHub";

  customSkillsInput.value = "Docker, AWS";

  jobDescriptionInput.value =
    "Required: strong problem-solving skills, C++ or Java, data structures and algorithms, object-oriented programming, Git, and SQL. Experience with HTML and CSS is useful. Docker is nice to have. AWS is optional. Communication skills are preferred.";

  clearMessage();

  showMessage(
    "Demo information loaded. Click Analyze my skill gap to generate the report.",
    true
  );
}

async function clearHistory() {
  if (currentUser) {
    const { error } = await supabase
      .from("analyses")
      .delete()
      .eq("user_id", currentUser.id);

    if (error) {
      showMessage(
        "Could not clear online history: " + error.message,
        false
      );
      return;
    }
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Could not clear browser history:", error);
  }

  await renderHistory();
  showMessage("History cleared.", true);
}

/* =========================================
   EVENT LISTENERS
========================================= */

form.addEventListener("submit", analyzeSkills);

document.getElementById("demoButton").addEventListener("click", loadDemo);

document.getElementById("clearButton").addEventListener("click", clearForm);

document.getElementById("clearHistoryButton").addEventListener(
  "click",
  clearHistory
);

copyButton.addEventListener("click", copyReport);
downloadButton.addEventListener("click", downloadReport);

signUpButton.addEventListener("click", signUp);
signInButton.addEventListener("click", signIn);
signOutButton.addEventListener("click", signOut);

supabase.auth.onAuthStateChange(function (_event, session) {
  currentUser = session?.user ?? null;
  updateAuthUI();
  void renderHistory();
});

/* Load account and history when the page opens. */
refreshAuthState();
