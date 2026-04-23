class TrieNode {
    constructor() {
        this.children = {};
        this.isEndOfWord = false;
        this.data = []; // Store IDs or references
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    insert(word, dataItem) {
        let node = this.root;
        const lowerWord = word.toLowerCase();

        for (let char of lowerWord) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
        node.data.push(dataItem);
    }

    searchPrefix(prefix) {
        let node = this.root;
        const lowerPrefix = prefix.toLowerCase();

        for (let char of lowerPrefix) {
            if (!node.children[char]) {
                return [];
            }
            node = node.children[char];
        }
        return this._collectAllWords(node);
    }

    _collectAllWords(node) {
        let results = [];
        if (node.isEndOfWord) {
            results = [...results, ...node.data];
        }

        for (let char in node.children) {
            results = [...results, ...this._collectAllWords(node.children[char])];
        }
        return results;
    }
}

export default Trie;
