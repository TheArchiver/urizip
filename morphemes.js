"use strict";
{
  const fs = require('fs');
  const raw_words = fs.readFileSync( process.argv[2], { encoding: 'utf8' });
  const word_lines = raw_words.split(/\n/g).map( line => line.trim() );
  const ok_words = word_lines.filter( word => ! /['"]/.test( word ) );
  const MAX = 4;
  const BOOST = 1200;
  const dict = {};
  ok_words.forEach( word => {
    let w = '';
    for ( const char of word ) {
      if ( !(char in dict) ) {
        dict[char] = 1; 
      } else {
        dict[char] += 1;
      }
      if ( w+char in dict && w.length < MAX ) {
        w = w+char; 
        dict[w] += 1;
      } else {
        dict[w+char] = ( dict[w+char] || 0 ) + 1;
        w = char;
      }
    }
  });
  console.log( Object.keys( dict ).length );
  const raw_boost_words = fs.readFileSync( process.argv[3], { encoding: 'utf8' });
  const word_lines = raw_boost_words.split(/\n/g).map( line => line.trim() );
  const ok_boost_words = word_lines.filter( word => ! /['"]/.test( word ) );
  ok_boost_words.forEach( word => {
    let w = '';
    for ( const char of word ) {
      if ( w+char in dict && w.length < MAX ) {
        w = w+char; 
        dict[w] += BOOST;
      } else {
        dict[w+char] = ( dict[w+char] || 0 ) + BOOST;
        w = char;
      }
    }
  });
  for ( const morpheme of Object.keys( dict ) ) {
    morphemes.push( { morpheme, cover: dict[morpheme] * morpheme.length } ); 
  }
  morphemes.sort( (a,b) => b.cover - a.cover );
  morphemes.length = 1024;
  console.log( JSON.stringify( morphemes, null, 2 ));
}
