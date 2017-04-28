"use strict";
{
  const fs = require('fs');
  const { original_root, other_common_root, rest_root } = JSON.parse( fs.readFileSync('tld_tree.json', {encoding:'utf8'}));

  const codes = {
    original : {},
    other_common: {},
    rest: {}
  };

  original_root.root = 'original';
  other_common_root.root = 'other_common';
  rest_root.root = 'rest';
  const stack = [ original_root, other_common_root, rest_root ];

  let name = '';

  while( stack.length ) {
    const node = stack.pop();
    if ( node.root ) {
      name = node.root;
    }
    if ( node.left ) {
      stack.push( node.left );
    }
    if ( node.right ) {
      stack.push( node.right );
    }
    if ( node.tld ) {
      codes[name][node.tld] = node.code;
    }
  }

  console.log( JSON.stringify( codes, null, 2 ) );
}
