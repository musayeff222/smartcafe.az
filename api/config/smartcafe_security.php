<?php

/**
 * POS təhlükəsizlik PIN-ləri: DB-də xüsusi pin yoxdursa bu default dəyərlərlə yoxlanılır.
 * Front (PASSWORD_CATEGORIES) ilə eyni saxlayın.
 */
return [
    'categories' => ['azaltma', 'silme', 'legv', 'anbar', 'kassa'],
    'defaults' => [
        'azaltma' => '5669',
        'silme' => '5669',
        'legv' => '3478',
        'anbar' => '090922',
        'kassa' => '090922',
    ],
];
