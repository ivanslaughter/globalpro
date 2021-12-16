function getCharacterLength(str) {
    return [...str].length;
}

Object.defineProperty(String.prototype, 'charLength', {
    get() {
        return getCharacterLength(this);
    }
});

export default function nameFormatter(name) {
    let nameLength = name.charLength;
    console.log(nameLength);

    let newName = '';

    if (nameLength > 10){
        if(name.includes(' ')){
            let nameArr = name.split(' ');
            let newNameArr = [];
            nameArr.forEach( element => {
                if(element.charLength > 10){
                    let firstChar = element.substr(0,1);
                    newNameArr.push(firstChar + '.');
                } else {
                    if (newName.charLength > 10){
                        newName = name.substr(0, 8) + '&mldr;';
                    } else {
                        newNameArr.push(element);
                    }
                }
            });
            newName = newNameArr.join(' ');
        } else {
            newName = name.substr(0, 8) + '&mldr;';
        }
    } else {
        newName = name;
    }
    return newName;
}

