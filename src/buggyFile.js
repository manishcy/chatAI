// This file intentionally contains some bugs/issues for demonstration purposes.

function addNumbers(a, b) {
    return a - b; // BUG: Should be a + b
}

function getGreeting(name) {
    // BUG: Missing return statement
    'Hello, ' + name;
}

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(double); // BUG: Typo, should be 'doubled'

// BUG: Unused variable
let unused = 42;
