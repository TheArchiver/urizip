"use strict";
{
  const fs = require('fs');
  const morphemes = JSON.parse( fs.readFileSync( 'dict.json', { encoding: 'utf8' } ) );
  const mdict = morphemes.reduce( (a,m) => (a[m]=m.cover, a), {} );
  morphemes.sort( (a,b)=>b.cover - a.cover);
  const parts = require('./uri_parts.js');
  const target = process.argv[2];
  const boosta = parts[target+ "_boost"];
  const boost = new Set(boosta); 
  const outfile_name = target + "_dict.json";

  let minCover = morphemes[0].cover;
  let maxCover = morphemes[0].cover;
  let totalCover = 0;
  let statsByLength = [];

  for( const m of morphemes ) {
    if ( m.cover < minCover ) {
      minCover = m.cover;
    }
    if ( m.cover > maxCover ) {
      maxCover = m.cover;
    }
    totalCover += m.cover;
    const len = m.morpheme.length;
    let lenStats = statsByLength[len];
    if ( ! lenStats ) {
      lenStats = statsByLength[len] = {
        len,
        totalCover: 0,
        list: [],
        min: m.cover,
        max: m.cover
      };
    }
    lenStats.totalCover += m.cover;
    if ( m.cover < lenStats.min ) {
      lenStats.min = m.cover;
    }
    if ( m.cover > lenStats.max ) {
      lenStats.max = m.cover;
    }
    lenStats.list.push(m);
  }

  const avgCover = totalCover / morphemes.length;
  const medianCover = morphemes[Math.floor(morphemes.length / 2)].cover;

  for ( const lenStats of statsByLength ) {
    if ( !lenStats ) continue;
    lenStats.list.sort((a,b)=>b.cover - a.cover );
    lenStats.avgCover = lenStats.totalCover / lenStats.list.length;
    lenStats.medianCover = lenStats.list[Math.floor(lenStats.list.length / 2 )].cover;
  }
  
  const result = {
    avgCover,
    medianCover,
    totalCover,
    minCover,
    maxCover,
    statsByLength
  }
  
  for ( const boost_word of boost ) {
    const stats = statsByLength[boost_word.length];
    if ( ! ( boost_word in mdict ) ) {
      const cover = ( stats.medianCover + stats.avgCover + stats.max ) /3.0 * 0.8;
      mdict[boost_word] = cover;
      morphemes.push( {
        morpheme: boost_word,
        cover
      } );
    }
  }
  morphemes.sort( (a,b)=>b.cover - a.cover);
  morphemes.length = 1024;
  fs.writeFileSync( outfile_name, JSON.stringify( morphemes, null, 2 ), {encoding:'utf8'});
}
