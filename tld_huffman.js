"use strict";
{
  const fs = require('fs');
  const { original, other_common, rest } = JSON.parse( fs.readFileSync( 'tld_dict.json', { encoding: 'utf8' } ) );

  while( original.length > 1 ) {
    const [ a, b ] = [ original.pop(), original.pop() ];
    const leaf = { left : a, right : b, cover : a.cover + b.cover };
    original.push( leaf );
    original.sort( (a,b) => b.cover - a.cover );
  }

  const original_root = original.pop();

  while( other_common.length > 1 ) {
    const [ a, b ] = [ other_common.pop(), other_common.pop() ];
    const leaf = { left : a, right : b, cover : a.cover + b.cover };
    other_common.push( leaf );
    other_common.sort( (a,b) => b.cover - a.cover );
  }

  const other_common_root = other_common.pop();

  while( rest.length > 1 ) {
    const [ a, b ] = [ rest.pop(), rest.pop() ];
    const leaf = { left : a, right : b, cover : a.cover + b.cover };
    rest.push( leaf );
    rest.sort( (a,b) => b.cover - a.cover );
  }

  const rest_root = rest.pop();

  const stack = [ 
    { node: original_root, code : '' },
    { node: other_common_root, code: '' },
    { node: rest_root, code: '' }
  ];

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

  console.log( JSON.stringify( { original_root, other_common_root, rest_root }, null, 1 ) );
}
