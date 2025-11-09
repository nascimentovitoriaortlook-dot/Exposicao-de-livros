// VARIÁVEIS GLOBAIS
// ============================================================================

// LISTA BASE DE LIVROS: Estes livros serão carregados
// mesmo se o localStorage falhar. Você pode adicionar mais livros aqui se quiser que sejam permanentes.
let currentBooks = [
    {
        id: "1666491200000",
        title: "A Hipótese do Amor",
        price: "4.00",
        genre: "Romance",
        tags: ["Hot", "Professor/Aluno", "Contemporâneo"],
        seriesName: null,
        seriesOrder: null,
        coverSource: "https://m.media-amazon.com/images/I/71YvYD2jSFhL._SY522_.jpg", // Link Capa
        coverLocal: null, // Capa local (Base64)
        pdflink: "https://exemplo.com/livrocompleto.pdf",
        sampleLink: "https://exemplo.com/amostra.pdf",
        rating: 4.2
    },
    {
        id: "1666491200001",
        title: "Quarta Asa",
        price: "5.00",
        genre: "Fantasia",
        tags: ["Dragões", "Hot", "Amor entre inimigos"],
        seriesName: "O Empyriano",
        seriesOrder: 1,
        coverSource: "https://m.media-amazon.com/images/I/71E4c-XyO3L._SY522_.jpg", // Link Capa
        coverLocal: null, // Capa local (Base64)
        pdflink: null,
        sampleLink: "https://exemplo.com/amostra_quartaasa.pdf",
        rating: 5.0
    }
];

let editingBookId = null;
let currentContactLink = null;


// ELEMENTOS DO DOM (INTERFACE)
// ============================================================================

const bookshelfGrid = document.getElementById('bookshelf-grid');
const managerBooksList = document.getElementById('manager-books-list');
const bookForm = document.getElementById('book-form');
const searchInput = document.getElementById('search-input');
const emptyShowcaseMessage = document.getElementById('empty-showcase');
const emptyManagerMessage = document.getElementById('empty-manager');

// Tabs (Vistas)
const showcaseView = document.getElementById('showcase-view');
const managerView = document.getElementById('manager-view');
const tabShowcase = document.getElementById('tab-showcase');
const tabManager = document.getElementById('tab-manager');

// Formulário
const titleInput = document.getElementById('title');
const priceInput = document.getElementById('price');
const ratingInput = document.getElementById('rating');
const genreInput = document.getElementById('genre');
const tagsSelect = document.getElementById('tags');
const seriesNameInput = document.getElementById('series-name');
const seriesOrderInput = document.getElementById('series-order');
const coverLinkInput = document.getElementById('cover-link');
const sampleLinkInput = document.getElementById('sample-link');
const pdfLinkInput = document.getElementById('pdf-link');
const submitButton = document.getElementById('submit-button');
const cancelEditButton = document.getElementById('cancel-edit-button');

// Capa Local
const coverUploadInput = document.getElementById('cover-upload');
const coverFilenameSpan = document.getElementById('cover-filename');
const coverLocalStatus = document.getElementById('cover-local-status');
const clearCoverLocalButton = document.getElementById('clear-cover-local');
const coverPreviewImg = document.getElementById('cover-preview-img');

// Contato
const contactLinkInput = document.getElementById('contact-link-input');
const contactLinkButton = document.getElementById('contact-link-button');
const contactLinkDisplay = document.getElementById('contact-link-display');

// Modal
const statusModal = document.getElementById('status-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');


// FUNÇÕES DE UTILIDADE E PERSISTÊNCIA
// ============================================================================

/**
 * Salva a lista de livros no localStorage.
 */
function saveBooks() {
    try {
        // Filtra coverLocal que são null para reduzir o tamanho dos dados
        const booksToSave = currentBooks.map(book => ({
            ...book,
            coverLocal: book.coverSource && book.coverSource.startsWith('data:') ? book.coverSource : null // Salva apenas Base64 no campo coverLocal
        }));
        localStorage.setItem('books', JSON.stringify(booksToSave));
        showModal('Sucesso!', 'Os dados dos livros foram salvos.');
    } catch (e) {
        showModal('Erro de Salvamento', 'Não foi possível salvar os livros no seu navegador. Memória cheia?');
    }
}

/**
 * Carrega os livros do localStorage ou usa a lista padrão.
 */
function loadBooks() {
    try {
        const storedBooks = localStorage.getItem('books');
        if (storedBooks) {
            let loadedBooks = JSON.parse(storedBooks);

            // Garante que a estrutura base seja mantida (fallback para books não salvos)
            if (loadedBooks.length === 0) {
                 loadedBooks = currentBooks;
            } else {
                // Adiciona a lista carregada à lista de fallback, evitando duplicatas por ID
                const defaultBooksIds = new Set(currentBooks.map(b => b.id));
                const uniqueLoadedBooks = loadedBooks.filter(book => !defaultBooksIds.has(book.id));
                currentBooks = [...uniqueLoadedBooks];
            }
            
            // Corrige o link da capa para ser priorizado sobre o link do coverSource se for Base64
            currentBooks = currentBooks.map(book => {
                if (book.coverLocal && book.coverLocal.startsWith('data:')) {
                    book.coverSource = book.coverLocal;
                }
                return book;
            });
            
        } else {
            // Se não houver nada salvo, usa apenas a lista padrão
            currentBooks = currentBooks;
        }

    } catch (e) {
        showModal('Erro de Leitura', 'Não foi possível ler os dados salvos. Usando lista padrão.');
        currentBooks = currentBooks; // Usa a lista padrão em caso de erro
    }
}

/**
 * Salva o link de contato.
 */
function saveContactLink() {
    const link = contactLinkInput.value.trim();
    if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
        localStorage.setItem('contactLink', link);
        currentContactLink = link;
        updateContactLinkDisplay();
        showModal('Sucesso!', 'Link de contato salvo!');
    } else if (link === '') {
        localStorage.removeItem('contactLink');
        currentContactLink = null;
        updateContactLinkDisplay();
        showModal('Sucesso!', 'Link de contato removido!');
    } else {
        showModal('Erro', 'Por favor, insira um link válido (iniciando com http:// ou https://).');
    }
}

/**
 * Carrega o link de contato.
 */
function loadContactLink() {
    currentContactLink = localStorage.getItem('contactLink');
    if (currentContactLink) {
        contactLinkInput.value = currentContactLink;
        updateContactLinkDisplay();
    }
}

/**
 * Atualiza o link do botão "Fale Conosco" na Vitrine.
 */
function updateContactLinkDisplay() {
    if (currentContactLink) {
        contactLinkDisplay.href = currentContactLink;
        contactLinkDisplay.classList.remove('hidden');
    } else {
        contactLinkDisplay.classList.add('hidden');
    }
}

// FUNÇÕES DE EXIBIÇÃO
// ============================================================================

/**
 * Cria o HTML do Card para a Vitrine.
 * @param {object} book - Objeto do livro.
 * @returns {string} HTML do card.
 */
function createShowcaseCard(book) {
    // 1. Capa
    const coverUrl = book.coverSource || 'https://via.placeholder.com/150x225?text=Sem+Capa';
    
    // 2. Classificação (Estrelas)
    const ratingValue = parseFloat(book.rating) || 0;
    const fullStars = Math.floor(ratingValue);
    const hasHalfStar = ratingValue - fullStars >= 0.25 && ratingValue - fullStars < 0.75;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starHtml = '';
    for (let i = 0; i < fullStars; i++) {
        starHtml += '<span class="rating-star">★</span>';
    }
    if (hasHalfStar) {
        starHtml += '<span class="rating-star">½</span>'; // Unicode de meia estrela (ou use um ícone)
    }
    for (let i = 0; i < emptyStars; i++) {
        starHtml += '<span class="text-gray-500">★</span>';
    }
    
    const ratingDisplay = `${starHtml} <span class="text-xs text-gray-400">(${ratingValue.toFixed(1)}/5)</span>`;
    
    // 3. Tags (Primeiras 3 tags)
    const tagsDisplay = book.tags && book.tags.length > 0
        ? book.tags.slice(0, 3).map(tag => `<span class="text-xs text-gray-400">${tag}</span>`).join(' • ')
        : 'Sem Tags';
        
    // 4. Série
    const seriesDisplay = book.seriesName 
        ? `<span class="block text-xs font-semibold text-primary mb-1">${book.seriesName} #${book.seriesOrder || 1}</span>`
        : '';
        
    // 5. Botões de Ação
    let mainButtonHtml = '';
    if (book.sampleLink) {
        mainButtonHtml = `<a href="${book.sampleLink}" target="_blank" 
                            class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 rounded-md transition-colors mb-2">
                            Ver Amostra Grátis
                          </a>`;
    } else if (book.pdflink) {
        mainButtonHtml = `<a href="${book.pdflink}" target="_blank" 
                            class="block w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded-md transition-colors mb-2">
                            Baixar PDF Completo
                          </a>`;
    } else if (currentContactLink) {
        // Se não tiver link de amostra nem PDF, mostra o botão de contato
        mainButtonHtml = `<a href="${currentContactLink}" target="_blank" 
                            class="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 rounded-md transition-colors mb-2">
                            Fale Conosco
                          </a>`;
    }

    return `
        <div class="book-card p-3 rounded-lg bg-gray-700 text-white">
            ${seriesDisplay}
            <img src="${coverUrl}" alt="Capa do livro ${book.title}" class="book-cover">
            <h3 class="text-md font-bold truncate mb-1">${book.title}</h3>
            <p class="text-sm text-gray-300 mb-1">${book.genre}</p>
            <div class="mb-2">${ratingDisplay}</div>
            <p class="text-xs text-gray-400 mb-2 truncate">${tagsDisplay}</p>
            <p class="text-lg font-extrabold text-primary mb-3">R$ ${parseFloat(book.price).toFixed(2).replace('.', ',')}</p>
            ${mainButtonHtml}
        </div>
    `;
}

/**
 * Cria o HTML do Card para o Gerenciador (Edição/Exclusão).
 * @param {object} book - Objeto do livro.
 * @returns {string} HTML do card.
 */
function createManagerCard(book) {
    const coverUrl = book.coverSource || 'https://via.placeholder.com/100x150?text=Sem+Capa';
    
    return `
        <div class="manager-card p-4 rounded-lg flex items-center justify-between shadow-md space-x-4">
            <div class="flex items-center space-x-4 flex-grow">
                <img src="${coverUrl}" alt="Capa" class="w-16 h-24 object-cover rounded-md flex-shrink-0">
                <div class="flex-grow min-w-0">
                    <h4 class="text-lg font-bold text-white truncate">${book.title}</h4>
                    <p class="text-sm text-gray-400">${book.genre}</p>
                    <p class="text-sm font-semibold text-primary">R$ ${parseFloat(book.price).toFixed(2).replace('.', ',')}</p>
                </div>
            </div>
            <div class="flex space-x-2 flex-shrink-0">
                <button onclick="editBook('${book.id}')" 
                        class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-semibold py-2 px-3 rounded transition-colors">
                    Editar
                </button>
                <button onclick="deleteBook('${book.id}')" 
                        class="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded transition-colors">
                    Excluir
                </button>
            </div>
        </div>
    `;
}

/**
 * Renderiza a lista de livros na Vitrine (filtrada ou completa).
 * @param {Array} books - Lista de livros a serem exibidos.
 */
function renderShowcase(books) {
    bookshelfGrid.innerHTML = '';
    if (books.length === 0) {
        emptyShowcaseMessage.classList.remove('hidden');
    } else {
        emptyShowcaseMessage.classList.add('hidden');
        books.forEach(book => {
            bookshelfGrid.innerHTML += createShowcaseCard(book);
        });
    }
}

/**
 * Renderiza a lista de livros no Gerenciador.
 */
function renderManagerList() {
    managerBooksList.innerHTML = '';
    if (currentBooks.length === 0) {
        emptyManagerMessage.classList.remove('hidden');
    } else {
        emptyManagerMessage.classList.add('hidden');
        // Ordena por título
        const sortedBooks = [...currentBooks].sort((a, b) => a.title.localeCompare(b.title));
        sortedBooks.forEach(book => {
            managerBooksList.innerHTML += createManagerCard(book);
        });
    }
}

/**
 * Filtra os livros com base no termo de busca.
 */
function filterBooks() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderShowcase(currentBooks);
        return;
    }

    const filtered = currentBooks.filter(book => {
        const matchesTitle = book.title.toLowerCase().includes(searchTerm);
        const matchesGenre = book.genre.toLowerCase().includes(searchTerm);
        const matchesTags = book.tags && book.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        return matchesTitle || matchesGenre || matchesTags;
    });

    renderShowcase(filtered);
}


// FUNÇÕES DO FORMULÁRIO (CRUD)
// ============================================================================

/**
 * Lida com o envio do formulário, adicionando ou editando um livro.
 * @param {Event} e - Evento de envio.
 */
function handleFormSubmit(e) {
    e.preventDefault();

    // 1. Coleta e Validação Básica
    const title = titleInput.value.trim();
    const price = parseFloat(priceInput.value).toFixed(2);
    const rating = ratingInput.value ? parseFloat(ratingInput.value) : null;
    const genre = genreInput.value;
    const seriesName = seriesNameInput.value.trim() || null;
    const seriesOrder = seriesOrderInput.value ? parseInt(seriesOrderInput.value, 10) : null;
    const coverLink = coverLinkInput.value.trim() || null;
    const sampleLink = sampleLinkInput.value.trim() || null;
    const pdfLink = pdfLinkInput.value.trim() || null;
    
    // Coleta as tags selecionadas
    const selectedTags = Array.from(tagsSelect.options)
        .filter(option => option.selected)
        .map(option => option.value);

    // Prioriza capa local (Base64) se houver
    const localCoverData = coverPreviewImg.dataset.base64 || null;
    const finalCoverSource = localCoverData || coverLink;

    if (!title || isNaN(price) || !genre || !finalCoverSource) {
        showModal('Erro', 'Por favor, preencha Título, Preço, Gênero e forneça uma Capa (Link ou Upload).');
        return;
    }

    const newBook = {
        title,
        price,
        genre,
        tags: selectedTags,
        seriesName,
        seriesOrder,
        coverSource: finalCoverSource,
        coverLocal: localCoverData, // Salva para manter a persistência Base64
