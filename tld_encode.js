"use strict";
{
  const fs = require('fs');
  const tree = JSON.parse( fs.readFileSync('tree.json', {encoding:'utf8'}));
  const codes = {};

  const stack = [ tree ];

  while( stack.length ) {
    const node = stack.pop();
    if ( node.left ) {
      stack.push( node.left );
    }
    if ( node.right ) {
      stack.push( node.right );
    }
    if ( node.morpheme ) {
      codes[node.morpheme] = node.code;
    }
  }

  console.log( JSON.stringify( codes, null, 2 ) );
}
