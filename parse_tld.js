"use strict";
{
  const fs = require('fs');
  const tld_raw = fs.readFileSync( 'tld.dat', { encoding: 'utf8' } ).split( /\n/g );
  const tld_names = tld_raw.filter( line => {
    const isEmpty = line.trim().length == 0;
    const isComment = line.startsWith( '//' );
    return ! ( isEmpty || isComment );
  });

  console.log( JSON.stringify( tld_names, null, 2 ) );
}
