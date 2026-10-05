# Bencode — Cheat Sheet

## Integer

```text
i42e
```

- `i` = début
- `e` = fin
- entre les deux = chiffres

```text
i → 42 → e
```

En TypeScript :

```ts
number
```

Logique :

```text
lire "i"
→ avancer
→ lire les chiffres
→ s'arrêter sur "e"
→ retourner le nombre
```

---

## String

```text
4:test
```

- `4` = longueur
- `:` = séparateur
- `test` = données

On lit exactement **4 octets**.

En TypeScript :

```ts
Buffer
```

---

## List

```text
l4:spam4:eggse
```

- `l` = début
- `e` = fin
- entre les deux = valeurs

Résultat :

```ts
BencodeValue[]
```

Une liste peut contenir n'importe quel `BencodeValue`.

---

## Dictionary

```text
d4:name4:spame
```

- `d` = début
- `e` = fin
- clé → valeur

Résultat :

```ts
Map<string, BencodeValue>
```

Ici :

```text
"name" → "spam"
```

---

## Récursivité

```ts
type BencodeValue =
  | number
  | Buffer
  | BencodeValue[]
  | Map<string, BencodeValue>;
```

Une liste peut contenir une liste/dictionary/etc.

Donc `parseValue()` peut s'appeler elle-même.

---

## parseValue()

Regarder :

```ts
data[index]
```

Puis :

```text
i   → integer
l   → list
d   → dictionary
0-9 → string
```

À chaque fois :

```text
reconnaître
→ décoder
→ avancer index
→ retourner
```