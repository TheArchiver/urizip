"use strict";
{
  const fs = require('fs');
  const morphemes = JSON.parse( fs.readFileSync( process.argv[2] || 'dict.json', { encoding: 'utf8' } ) );

  while( morphemes.length > 1 ) {
    const [ a, b ] = [ morphemes.pop(), morphemes.pop() ];
    const leaf = { left : a, right : b, cover : a.cover + b.cover };
    morphemes.push( leaf );
    morphemes.sort( (a,b) => b.cover - a.cover );
  }

  const root = morphemes.pop();

  const stack = [ { node: root, code : '' } ];

  while( stack.length ) {
    const { node, code } = stack.pop();
    if ( node.left ) {
      stack.push( { node : node.left, code : code + '0' } );
    }
    if ( node.right ) {
      stack.push( { node : node.right, code : code + '1' } );
    }
    node.code = code;
  }

  console.log( JSON.stringify( root, null, 1 ) );
}
