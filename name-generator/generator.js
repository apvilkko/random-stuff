'use strict';

var choices = [
  [
    "Frontend",
    "Client Side"
  ],
  [
    "Practitioners'",
    "Developers'",
    "Lovers'",
    "Enthusiasts'",
    "Excellence",
    "Skill",
    "Craftmanship",
    "Learning",
    "Hipster"
  ],
  [
    "Guild",
    "Club",
    "Massive",
    "Collective",
    "Group",
    "Association"
  ]
];

function random(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function sample(collection) {
  return collection[random(0, collection.length - 1)];
}

function generate() {
  var result = [sample(choices[0]), sample(choices[1]), sample(choices[2])].join(' ');
  document.getElementById('result').innerHTML = result;
}
