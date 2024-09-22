document.addEventListener("DOMContentLoaded", function() {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
    const burgerMenu = document.querySelector(".burger-menu");
    const navLinks = document.querySelector(".nav-links");
    const linkspan = document.querySelector('.linkspan');
    const footerParagraph = document.querySelector('footer p');
    const searchContainer = document.querySelector('.search-container');


    function updateSearchContainerVisibility() {
        if (window.innerWidth <= 768 || navLinks.classList.contains("active")) {
            searchContainer.style.display = 'none';
        } else {
            searchContainer.style.display = 'flex';
        }
    }

    burgerMenu.addEventListener("click", function() {
        navLinks.classList.toggle("active");
        
        // Ocultar o mostrar el buscador según el estado del menú burger
        if (navLinks.classList.contains("active")) {
            searchContainer.style.display = 'none'; 
        } else {
            searchContainer.style.display = 'flex';
        }
    });

    // Asegurarse de que el buscador esté visible al cargar la página
    if (!navLinks.classList.contains("active")) {
        searchContainer.style.display = 'flex';
    }

    // Ajustar el comportamiento al cambiar el tamaño de la ventana
    window.addEventListener('resize', function() {
        if (!navLinks.classList.contains("active")) {
            if (window.innerWidth > 768) { 
                searchContainer.style.display = 'flex';
            } else {
                searchContainer.style.display = 'none';
            }
        }
    }); 

    linkspan.addEventListener('mouseover', function() {
        this.style.color = 'white';
        footerParagraph.classList.add('change-color');
    });

    linkspan.addEventListener('mouseout', function() {
        this.style.color = '#e04107';
        footerParagraph.classList.remove('change-color');
    });

    scrollToTopBtn.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    scrollToBottomBtn.addEventListener("click", function() {
        const windowHeight = window.innerHeight;
        const fullHeight = document.body.clientHeight;

        window.scrollTo({
            top: fullHeight - windowHeight,
            behavior: "smooth"
        });
    });

    const videoSection = document.querySelector('section .video-grid');

    const playlistIds = [                  // Channel ID de los canales escogidos:
        'UUBo-8yyej5wNMHtutWDntpg',        // Cell
        'UUCy7d2_IXCsrdHuNZ0mgRfg',        // Tio Shur
        'UUhGFgTAB1QsWPvsiOF1G3yg',        // La Salseria
        'UUfaMFUL4RDSjvOxrnucR1Jw',        // Nauterplay
        'UUYa0ThEUb3H4vM_9_LNiUQg',        // YanPi
        'UUiUUWusm1Fgg0N8Gj6InnnQ',        // El Tartaja
        'UU4Rlh_qBENuJpub8KbfnWjA',        // HagamosTendencia
        'UUr1MBAN3AsiSaw2cUHzh3Jw'         // MDANoticias
    ];

    const videosPerPage = 20;
    let currentPage = 1;
    let allVideos = [];
    let loadedPlaylists = 0;

    // Mostrar loaders inicialmente
    for (let i = 0; i < videosPerPage; i++) {
        const loaderElement = document.createElement('div');
        loaderElement.classList.add('yt-video');
        loaderElement.innerHTML = '<span class="loader"></span>';
        videoSection.appendChild(loaderElement);
    }

    playlistIds.forEach((playlistId, index) => {
        setTimeout(() => {
            getVideos(playlistId);
        }, 1500 * index);
    });


    // Función para obtener videos desde la llamada a la API:
    function getVideos(playlistId) {
        fetch(`/api/videos?playlistId=${playlistId}`)
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            if (!data.items) {
              throw new Error('No items found in the API response');
            }
            
            const validVideos = data.items.filter(item => {
              const duration = item.contentDetails.duration;
              const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
              const hours = (match[1] ? parseInt(match[1]) : 0);
              const minutes = (match[2] ? parseInt(match[2]) : 0);
              const seconds = (match[3] ? parseInt(match[3]) : 0);
              const totalSeconds = hours * 3600 + minutes * 60 + seconds;
              return totalSeconds >= 120 && totalSeconds <= 4200;
            }).map(video => ({
              id: video.id,
              title: video.snippet.title,
              thumbnail: video.snippet.thumbnails.medium.url,
              publishedAt: new Date(video.snippet.publishedAt)
            }));
    
            allVideos = [...allVideos, ...validVideos];
            loadedPlaylists++;
    
            if (loadedPlaylists === playlistIds.length) {
              allVideos = allVideos.filter((video, index, self) =>
                index === self.findIndex((v) => v.id === video.id)
              );
              allVideos.sort((a, b) => b.publishedAt - a.publishedAt);
              displayVideos();
            }
          })
          .catch(err => console.error('Error fetching videos:', err.message));
      }

    // Función para filtrar y controlar videos mostrados
    function displayVideos(filteredVideos = allVideos) {
        const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
        const startIndex = (currentPage - 1) * videosPerPage;
        const endIndex = startIndex + videosPerPage;
        const videosToShow = filteredVideos.slice(startIndex, endIndex);

        videoSection.innerHTML = '';

        videosToShow.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.classList.add('yt-video');

            videoElement.innerHTML = `
                <a class="video-link" href="#" data-video-id="${video.id}">
                    <img src="${video.thumbnail}" alt="${video.title}">
                </a>
                <h3>${video.title}</h3>
                <div class="date-container">
                    <p>${video.publishedAt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                </div>
            `;

            videoSection.appendChild(videoElement);
        });

        const videoLinks = document.querySelectorAll('.video-link');
        videoLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const videoId = this.getAttribute('data-video-id');
                openPopup(videoId);
            });
        });

        document.getElementById('pageCounter').innerText = `${currentPage} / ${totalPages}`;
    }


    // Funciones de paginación

    // Ir a la primera página
    document.getElementById('firstPageBtn').addEventListener('click', function() {
        currentPage = 1;
        window.scrollTo(0, 0);
        displayVideos();
    });

    // Ir 3 páginas atras
    document.getElementById('prevThreePagesBtn').addEventListener('click', function() {
        currentPage = Math.max(currentPage - 3, 1);
        window.scrollTo(0, 0);
        displayVideos();
    });

    // Ir a la página anterior
    document.getElementById('prevPageBtn').addEventListener('click', function() {
        currentPage = Math.max(currentPage - 1, 1);
        window.scrollTo(0, 0);
        displayVideos();
    });

    // Ir a la página siguiente
    document.getElementById('nextPageBtn').addEventListener('click', function() {
        const totalPages = Math.ceil(allVideos.length / videosPerPage);
        currentPage = Math.min(currentPage + 1, totalPages);
        window.scrollTo(0, 0);
        displayVideos();
    });

    // Ir 3 páginas adelante
    document.getElementById('nextThreePagesBtn').addEventListener('click', function() {
        const totalPages = Math.ceil(allVideos.length / videosPerPage);
        currentPage = Math.min(currentPage + 3, totalPages);
        window.scrollTo(0, 0);
        displayVideos();
    });

    // Ir a la última página
    document.getElementById('lastPageBtn').addEventListener('click', function() {
        const totalPages = Math.ceil(allVideos.length / videosPerPage);
        window.scrollTo(0, 0);
        currentPage = totalPages;
        displayVideos();
    });


    // Función para abrir el popup de video
    function openPopup(videoId) {
        const videoPopup = document.getElementById('videoPopup');
        const videoFrame = document.getElementById('videoFrame');

        videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        videoPopup.classList.add('active');
        videoPopup.style.display = 'flex';
        setTimeout(() => {
            videoPopup.classList.remove('closing');
        }, 50);
    }

    // Cerrar el popup
    document.querySelector('.close-popup').addEventListener('click', function() {
        const videoPopup = document.getElementById('videoPopup');
        const videoFrame = document.getElementById('videoFrame');

        videoPopup.classList.add('closing');
        videoFrame.src = ''; 
        setTimeout(() => {
            videoPopup.classList.remove('active');
            videoPopup.style.display = 'none';
        }, 500);
    });

    // Aplica estilos al colocar el cursor sobre el video
    window.addEventListener('click', function(event) {
        const videoPopup = document.getElementById('videoPopup');
        const videoFrame = document.getElementById('videoFrame');

        if (event.target === videoPopup) {
            videoPopup.classList.add('closing');
            videoFrame.src = ''; 
            setTimeout(() => {
                videoPopup.classList.remove('active');
                videoPopup.style.display = 'none';
            }, 500);
        }
    });


    // Funcionalidad de búsqueda
    function performSearch() {
        const searchText = document.getElementById('searchText').value.toLowerCase();
        const startDateInput = document.getElementById('startDate').value;
        const endDateInput = document.getElementById('endDate').value;

        const startDate = startDateInput ? new Date(startDateInput) : null;
        const endDate = endDateInput ? new Date(endDateInput) : null;

        const filteredVideos = allVideos.filter(video => {
            const isTextMatch = video.title.toLowerCase().includes(searchText);

            let isDateInRange;
            if (startDate && endDate) {
                isDateInRange = video.publishedAt >= startDate && video.publishedAt <= endDate;
            } else if (startDate) {
                isDateInRange = video.publishedAt.toDateString() === startDate.toDateString();
            } else if (endDate) {
                isDateInRange = video.publishedAt.toDateString() === endDate.toDateString();
            } else {
                isDateInRange = true;
            }

            return isTextMatch && isDateInRange;
        });

        currentPage = 1;
        displayVideos(filteredVideos);
    }

    document.getElementById('searchBtn').addEventListener('click', performSearch);

    document.getElementById('searchText').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch();
        }
    });

    // Lógica para el submenú desplegable
    const dropdown = document.querySelector(".dropdown");
    if (dropdown) {
        dropdown.addEventListener("click", function() {
            this.querySelector(".dropdown-content").classList.toggle("show");
        });
    }
});
