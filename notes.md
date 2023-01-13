Entering invalid Dates in Author form (and Book Instance form when 
non-empty) causes error or crash. Not sure why since the Author form 
and relevant Controller are almost exactly as they are given in the 
tutorial
    * may have to do with browser compatibility
    * may have to do with the layout system (pug) or something that
      bootstrap is doing? When leaving Author's name blank there is
      an alert saying "Please fill out this field" instead of "First 
      name must be specified." as specified in the Controller