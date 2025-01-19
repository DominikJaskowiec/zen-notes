const repoOwner = 'dominikjaskowiec';  // Replace with your GitHub username
const repoName = 'zen-notes';  // Replace with your repository name
const notesFolderPath = 'notes';  // Folder where your .md files are stored

let fuse;
let markdownCache = {};
let notes = [];

// Function to load markdown content from a file
const loadMarkdown = async (note) => {
  if (markdownCache[note.path]) {
    return markdownCache[note.path];
  }

  const response = await fetch(note.path);
  const markdown = await response.text();
  markdownCache[note.path] = markdown;
  return markdown;
};

// Function to render markdown as HTML
const renderMarkdown = (markdown) => {
  return marked(markdown);
};

// Function to render the list of notes
const renderNotes = (filteredNotes) => {
  const notesListContainer = document.getElementById('notes-list');
  notesListContainer.innerHTML = '';

  filteredNotes.forEach(note => {
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');
    noteElement.textContent = note.name;

    noteElement.onclick = async () => {
      const markdown = await loadMarkdown(note);
      const preview = document.getElementById('markdown-preview');
      preview.innerHTML = renderMarkdown(markdown);
    };

    notesListContainer.appendChild(noteElement);
  });
};

// Function to search contents of notes
const searchNotesContent = async (searchTerm) => {
  // Load the content of all notes for searching
  const searchResults = [];
  
  for (const note of notes) {
    const markdown = await loadMarkdown(note);
    searchResults.push({
      ...note,
      content: markdown,
    });
  }

  // Now set up Fuse.js to search the content of each note
  const fuse = new Fuse(searchResults, {
    keys: ['content'],
    includeScore: true,
    threshold: 0.3, // Set a threshold for fuzzy matching (you can adjust this value)
  });

  return fuse.search(searchTerm);
};

// Setup fuzzy search
const setupSearch = () => {
  const searchInput = document.getElementById('search');

  searchInput.addEventListener('input', async (e) => {
    const searchTerm = e.target.value;

    if (searchTerm.trim() === "") {
      renderNotes(notes);  // If search input is empty, show all notes
      return;
    }

    const results = await searchNotesContent(searchTerm);

    // Get the actual notes from the search results
    const filteredNotes = results.map(result => result.item);
    renderNotes(filteredNotes);
  });
};

// Function to fetch the list of markdown files from GitHub
const fetchNotesList = async () => {
  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${notesFolderPath}`);
  const files = await response.json();

  notes = files
    .filter(file => file.name.endsWith('.md'))  // Filter out only .md files
    .map(file => ({
      name: file.name.replace('.md', ''),  // Remove the file extension for the display name
      path: file.download_url,  // Use the file's download URL for fetching content
    }));

  renderNotes(notes);
};

const init = () => {
  fetchNotesList();  // Fetch and display notes list
  setupSearch();  // Set up fuzzy search
};

init();

