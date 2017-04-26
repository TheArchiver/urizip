"use strict";
{
  const btoa = require('btoa');
  const word = process.argv[2];
  const codes = JSON.parse( require('fs').readFileSync( "codes.json", {encoding:'utf8'} ) );

  let encoding = ''
  let code = '';
  for( const char of word ) {
    if ( code+char in codes ) {
      code = code+char;
    } else {
      console.log( code, codes[code] );
      encoding += codes[code];
      code = char;
    }
  }
  if ( code.length ) {
    console.log( code, codes[code] );
  }

  console.log( encoding );
  const bytes = [];
  encoding = encoding.split('');
  while( encoding.length ) {
    bytes.push( encoding.splice(0,8).join('') );
  }
  console.log( bytes );
  bytes.forEach( (s,i) => {
    bytes[i] = parseInt(s,2);
  });
  console.log( bytes );
  bytes.forEach( (b,i) => {
    bytes[i] = String.fromCharCode( b );
  });
  console.log( btoa( bytes.join('' ) ) );
}

