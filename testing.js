(() => {
    const FLAG_REGEX = /^--([a-z]*)=([^\s]+)$/i;
    const check = FLAG_REGEX.exec('--verbose=true');

    console.log(check);

})();