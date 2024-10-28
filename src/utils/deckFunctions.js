// deckFunctions.js

// Function to create deck 
function createDeck() {
    const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push(`${rank} of ${suit}`);
        }
    }
    return deck;
}

// Function to shuffle the deck (using Fisher-Yates algorithm)
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Function to deal a card from the deck
function dealCard(deck) {
    if (deck.length === 0) {
        throw new Error('No cards left in the deck');
    }
    return deck.pop();
}

// Function to display card
function displayCard(card) {
    let display = "";
    const parts = card.split(" of ");
    const rank = parts[0];
    const suit = parts[1];

    switch (suit) {
        case "Hearts":
            display = "♥️" + rank;
            break;
        case "Diamonds":
            display = "♦️" + rank;
            break;
        case "Clubs":
            display = "♣️" + rank;
            break;
        case "Spades":
            display = "♠️" + rank;
            break;
        default:
            display = "Unknown";
            break;
    }

    return display; // Return the display value
}

// Function to calculate points for a hand in baccarat
function calculatePoints(hand) {
    let points = 0;
    for (let card of hand) {
        const rank = card.split(" ")[0]; // Extract rank from card (e.g., "2 of Hearts" -> "2")
        if (rank === "J" || rank === "Q" || rank === "K") {
            points += 10;
        } else if (rank === "A") {
            points += 1; // Ace initially counts as 1, further logic can adjust it to 11 as needed
        } else {
            points += parseInt(rank); // Convert rank to integer and add to points
        }
    }
    return points % 10; // Return points modulo 10 for baccarat scoring
}

// Function to calculate points for a card in blackjack
function bjCalcPoints(hand) {
    let points = 0;
    let aceCount = 0;

    // Iterate through each card in the hand
    for (let card of hand) {
        let rank = card.split(" of ")[0];

        if (rank === "J" || rank === "Q" || rank === "K") {
            // Face cards are worth 10 points
            points += 10;
        } else if (rank === "A") {
            // Ace can be worth 1 or 11
            points += 11;
            aceCount++;
        } else {
            // Number cards worth their face value
            points += parseInt(rank);
        }
    }

    // Adjust points if there are Aces and total points exceed 21
    while (points > 21 && aceCount > 0) {
        points -= 10; // Change Ace value from 11 to 1
        aceCount--;
    }

    return points;
}

// Function to determine if split in blackjack
function splitOptions(hand) {
    let result = true;
    let firstFace = "no";
    let secondFace = "naw";
    const first = hand[0].split(" ")[0];
    const second = hand[1].split(" ")[0];

    if (first == "J" || first == "Q" || first == "K" || first == "A") {
        firstFace = "yes";
    }
    if (second == "J" || second == "Q" || second == "K" || second == "A") {
        secondFace = "yes";
    }

    if (first == second || firstFace == secondFace) {
        result = false;
    }

    return result;
}

// Function to display images 
function createImages(index) {
    const images = [
        // camden poker
        "https://cdn.discordapp.com/attachments/425842619134771210/1259395823498956800/IMG_1957.jpg?ex=6696bc02&is=66956a82&hm=ce8f0ece84a2cb4b9404989d1dfc36e8e185f89954698ff48e393c4cad6ce4b4&",

    ];

    if (index >= 0 && index < images.length) {
        return images[index];
    } else {
        throw new Error('Invalid image index');
    }
}

module.exports = {
    createDeck,
    shuffleDeck,
    dealCard,
    calculatePoints,
    bjCalcPoints,
    createImages,
    splitOptions,
    displayCard
};