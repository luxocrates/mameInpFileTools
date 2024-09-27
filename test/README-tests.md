This directory contains data for testing of the mameInpFileTools sources:

* `wrinkled.inp`
  * a `bublbobl` captured input file with discontinuities

* `unwrinkled-gold.inp`
  * expected output from running `unwrinkler.mjs` on `wrinkled.inp`
  
* `bobbled_gold.inp`
  * expected output from running `bobbler.mjs` on `unwrinkled-gold.inp`


Right now, testing is manual. It’d look something like this:

    test% ../unwrinkle.mjs wrinkled.inp             
    Success! Wrote to unwrinkled.inp with 4 patches

    test% diff unwrinkled.inp unwrinkled_gold.inp

    test% ../bobbler.mjs unwrinkled_gold.inp bobbled.inp
    Converting unwrinkled_gold.inp...
    Success: created bobbled.inp

    test% diff bobbled_gold.inp bobbled.inp

    test% rm unwrinkled.inp bobbled.inp 
