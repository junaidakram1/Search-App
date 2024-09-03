const form = document.getElementById('search-bar');
const search = document.getElementById('search');
const cross = document.getElementById('cross');
const searchBtn = document.getElementById('search-button');


// To check if the page has loaded everything
document.addEventListener('readystatechange', (event) => {
    if (event.target.readyState === "complete") {
        initApp();
    }
});

function initApp() {

    setFocus();

    search.addEventListener('input', showclearTextBtn);
    cross.addEventListener('click', clearSearchText);
    cross.addEventListener('keydown', clearUsingBtn);
    searchBtn.addEventListener('click', submitSearch);
    form.addEventListener('submit', submitSearch);

}


const setFocus = () => {
    document.getElementById("search").focus();
}

// Button handelling

const showclearTextBtn = () => {
    const search = document.getElementById('search');
    const clear = document.getElementById('cross');

    if (search.value.length) {
        clear.classList.remove('hidden');
    }
    else {
        clear.classList.add("hidden");
    }
}


const clearSearchText = (event) => {
    event.preventDefault();
    document.getElementById('search').value = "";
    cross.classList.add('hidden');
    setFocus();
}

// Clear text using enter/spacebar key when cross btn is focused

const clearUsingBtn = (event) => {

    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        document.getElementById('cross').click();
    }

}

// So-called modules

// Gets the term from the searchbar
const getTerm = () => {

    const rawSearchTerm = document.getElementById('search').value.trim(); // Also trims spaces either side
    const regex = /[]{2,}/gi; // To identify two or more spaces in a row (continously) in the search term
    const searchTerm = rawSearchTerm.replaceAll(regex, " ") //Replace all the multiple spaces with a single space
    return searchTerm;
}

// Identifies max no. of characters that can be adjusted
const getmaxChar = () => {
    const width = window.innerWidth || document.body.clientWidth;
    let maxChars;
    if (width < 414) maxChars = 65;
    if (width >= 414 && width < 1400) maxChars = 100;
    if (width >= 1400) maxChars = 130;

    return maxChars;
}

// Gets a search string from wiki against user prompt and encodes it

const getwikiSearchString = (searchTerm) => {

    const maxChar = getmaxChar(); // To tell API the no. of characters required according to viewport
    const rawSearchString = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${searchTerm}&gsrlimit=20&prop=pageimages|extracts&exchars=${maxChar}&exintro&explaintext&format=json&origin=*`;

    const searchString = encodeURI(rawSearchString);
    return searchString

}

// Extracts json from the encoded wiki string

const requestData = async (wikisearchString) => {

    try {
        const reponse = await fetch(wikisearchString);
        const data = await reponse.json();
        return data;
    }

    catch (err) {
        console.error(err);

    }
}

// Processess json to extract key value pairs

const processWikiResult = (result) => {
    const resultArr = [];
    // Converts the json object into an array of keys which can be looped through to retrieve data
    Object.keys(result).forEach((key) => {
        const id = key;
        const title = result[key].title;
        const text = result[key].extract;
        const img = result[key].hasOwnProperty("thumbnail") ? result[key].thumbnail.source : null;
        const item = {
            id: id,
            title: title,
            img: img,
            text: text

        };
        resultArr.push(item); //Array of objects
    });

    return resultArr;

};

//Also acts as a procedural function dictating workflow

const retrieveResults = async (searchTerm) => {
    const wikiSearchString = getwikiSearchString(searchTerm);
    const wikiSearchResult = await requestData(wikiSearchString); // Retrieve json from the encoded wiki string
    let resultArr = [];
    if (wikiSearchResult.hasOwnProperty("query")) { // If it contains query sub-section, then extract the sub sub-section details from pages
        resultArr = processWikiResult(wikiSearchResult.query.pages); //Those details are extracted/stored

    }
    return resultArr; // Array of objects storing that key value pairs
}



// Helper functions to dynamically structure HTML using retrieved data

const createResultItem = (result) => {
    const resultItem = document.createElement("div");
    resultItem.classList.add('result-items');
    const resultTitle = document.createElement("div");
    resultTitle.classList.add('result-title');
    const link = document.createElement('a');
    link.href = `https://en.wikipedia.org/?curid=${result.id}`;
    link.textContent = result.title;
    link.target = "_blank"
    resultTitle.append(link);
    resultItem.append(resultTitle);
    return resultItem;
}

const createResultImg = (result) => {
    const resultImg = document.createElement('div');
    resultImg.classList.add('image-result');
    const img = document.createElement("img");
    img.src = result.img;
    img.alt = result.title;
    resultImg.append(img);
    return resultImg;
}

const createResultContent = (result) => {
    const resultContent = document.createElement("div");
    resultContent.classList.add('result-content');
    const resultText = document.createElement('p');
    resultText.classList.add('result-text');
    resultText.textContent = result.text;
    resultContent.append(resultText);
    return resultContent;
}

// Building/painting the data on page using above functions

const buildResult = (resultArr) => {
    resultArr.forEach((result) => {
        const resultItem = createResultItem(result);
        const resultContainer = document.createElement("div");
        resultContainer.classList.add("result-container");
        if (result.img) {
            const resultImg = createResultImg(result);
            resultContainer.append(resultImg);

        }

        const resultContent = createResultContent(result); //result-content / result-text
        resultContainer.append(resultContent);
        resultItem.append(resultContainer);
        const searchResults = document.getElementById('search-results');
        searchResults.append(resultItem);
    })
}

// Info Fuctions 

const clearInfo = () => {
    document.getElementById('info').textContent = "";
}

const setInfo = (numOfResults) => {
    const infoLine = document.getElementById('info');
    if (numOfResults) {
        infoLine.textContent = `Displaying ${numOfResults} results.`;
    }
    else {
        infoLine.textContent = "Oops, no results!";
    }
}

// Delete search results in the beginning using this function

const deleteSearchResults = () => {
    const parentElement = document.getElementById('search-results');
    let child = parentElement.lastElementChild;
    while (child) {
        parentElement.removeChild(child);
        child = parentElement.lastElementChild;

    }
}

//Parent functions that call child functions within, to have a smooth workflow

const submitSearch = (event) => {
    event.preventDefault(); //Prevents re-loading on search form
    deleteSearchResults();
    processSearch();
    setFocus();
}

const processSearch = async () => {

    clearInfo();

    const searchTerm = getTerm();

    if (searchTerm === "") return;

    let resultArr = await retrieveResults(searchTerm);

    if (resultArr.length) buildResult(resultArr);//To check if there is a result, then we'd build the result

    setInfo(resultArr.length);


}


