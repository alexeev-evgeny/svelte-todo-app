<script lang="ts">
import { createEventDispatcher } from 'svelte';
import type { TTodo } from '../store/TodosStore';

const dispatch = createEventDispatcher();
export let listItem: TTodo;
 
function remove() {
	dispatch('remove', listItem.id);
}

</script> 

<template>
<div class="list-item">
	<span class="list-item__title">
		{listItem.title}
	</span>
	<p class="list-item__text">
		{listItem.text}
	</p>
	<button 
		class="list-item__button-remove"
		on:click="{remove}">
		Remove
	</button>
</div>
</template>

<style>
.list-item {
	display: block;
	width: 100%;
	margin-bottom: 10px;
	padding: 10px 20px;
	box-sizing: border-box;
	background-color: gold;
}

.list-item__title {
	display: block;
	font-size: 18px;
	line-height: 28px;
}
.list-item__text {
	display: block;
	font-size: 14px;
	line-height: 24px;
}

.list-item__button-remove {
	cursor: pointer;
}
</style>