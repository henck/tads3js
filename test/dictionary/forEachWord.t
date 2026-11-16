#include <tads.h>
#include <dict.h>
#include <vector.h>

/*
 *   forEachWord(func) calls func(obj, str, vocabProp) once for each
 *   association, in arbitrary order.
 */
property noun, adjective, name;
class Thing: object name = '';

_main(args)
{
    local a = new Thing(); a.name = 'a';
    local b = new Thing(); b.name = 'b';
    local d = new Dictionary(nil);
    d.addWord(a, 'book', &noun);
    d.addWord(a, 'red', &adjective);
    d.addWord(b, 'book', &noun);

    local seen = new Vector();
    d.forEachWord(function(obj, str, prop) {
        seen.append(obj.name + ':' + str + ':' + (prop == &noun ? 'n' : 'adj'));
    });
    return seen.toList().sort() == ['a:book:n', 'a:red:adj', 'b:book:n'];
}
