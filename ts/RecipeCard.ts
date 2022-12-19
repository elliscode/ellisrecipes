import Link from './Link'
import Category from './Category'
import Servings from './Servings'
import Tags from './Tags'
import Title from './Title'

export default interface RecipeCard {
    card: HTMLDivElement;
    content: HTMLDivElement;
    title: Title;
    category: Category;
    servings: Servings;
    tags: Tags;
    link: Link;
}