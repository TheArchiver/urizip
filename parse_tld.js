"use strict";
{
  // data 
    // 8 ( 3 bits ) original and infrastructure
    const original = {
      ".com": "000",
      ".org": "001",
      ".gov": "010",
      ".net" : "011",
      ".int": "100",
      ".edu": "101",
      ".mil": "110",
      ".arpa": "111"
    };

    // 16 ( 4 bits ) other common 
    const other_common = {
      ".gov.uk": "0000",
      ".co.uk": "0001",
      ".co.jp": "0010",
      ".gov.au": "0011",
      ".com.au": "0100",
      ".co.nz": "0101",
      ".govt.nz": "0110",
      ".in": "0111",      // india
      ".co": "1000",
      ".ru": "1001",      // russia
      ".com.cn": "1010",    // china
      ".com.hk": "1011",    // china
      ".io": "1100",      // startups
      "goo.gl": "1101",      // goo.gl
      "bit.ly": "1110",      // bit.ly
      "youtu.be": "1111",      // youtu.be
    };

  // extractio and processing

    const fs = require('fs');
    const tld_raw = fs.readFileSync( 'tld.dat', { encoding: 'utf8' } ).split( /\n/g );
    const tld_names = tld_raw.filter( line => {
      const isEmpty = line.trim().length == 0;
      const isComment = line.startsWith( '//' );
      return ! ( isEmpty || isComment );
    }).sort();

  // there are around 8100 of these so we need 13 bits.
  // but we shall huff code it, to get max 14 bits, min...some amount less
  console.log( JSON.stringify( tld_names, null, 2 ) );
}
