import {
  variants,
  exercises,
  exercisesCategories,
  exercisesDescriptions,
} from "../../db/schemas";
import { CreateExerciseDescriptionDto } from "../../../domain/dtos/exercise/create-exercise-description.dto";
import { ExerciseDescriptionEntity } from "../../../domain/entities/exercise/exercise-description.entity";
import { ExerciseCategoryEntity } from "../../../domain/entities/exercise/exercise-category.entity";
import { and, eq, ilike, isNull, or } from "drizzle-orm";
import { ExerciseRepository } from "../../../domain/repositories/exercise/exercise.repository";
import { CreateExerciseDto } from "../../../domain/dtos/exercise/create-exercise.dto";
import { CreateVariantDto } from "../../../domain/dtos/exercise/create-variant.dto";
import { UpdateVariantDto } from "../../../domain/dtos/exercise/update-variant.dto";
import { ExerciseEntity } from "../../../domain/entities/exercise/exercise.entity";
import { VariantEntity } from "../../../domain/entities/exercise/variant.entity";
import { CustomError } from "../../../domain/errors/custom.error";
import { db } from "../../db";

export class ExerciseRepositoryImpl implements ExerciseRepository {
  async createExercise(
    createExerciseDto: CreateExerciseDto
  ): Promise<ExerciseEntity | CustomError> {
    try {
      const [newExercise] = await db
        .insert(exercises)
        .values({ ...createExerciseDto })
        .returning({
          id: exercises.id,
          name: exercises.name,
          video: exercises.video,
          category: exercises.categoryId,
          image: exercises.image,
        });

      if (!newExercise) {
        throw CustomError.internalServer("Error creating the exercise");
      }

      return ExerciseEntity.fromObject(newExercise);
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServer();
    }
  }
  async createVariant(
    createVariantDto: CreateVariantDto
  ): Promise<VariantEntity | CustomError> {
    try {
      const [newVariant] = await db
        .insert(variants)
        .values({ ...createVariantDto })
        .returning({
          id: variants.id,
          name: variants.name,
          video: variants.video,
          category: variants.categoryId,
          image: variants.image,
        });

      if (!newVariant) {
        throw CustomError.internalServer("Error creating the variant");
      }

      return VariantEntity.fromObject(newVariant);
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServer();
    }
  }
  async createExerciseDescription(
    createExerciseDescriptionDto: CreateExerciseDescriptionDto
  ): Promise<ExerciseDescriptionEntity | CustomError> {
    try {
      const [newExerciseDescription] = await db
        .insert(exercisesDescriptions)
        .values({ ...createExerciseDescriptionDto })
        .returning({
          id: exercisesDescriptions.id,
          description: exercisesDescriptions.description,
        });

      if (!newExerciseDescription) {
        throw CustomError.internalServer();
      }

      return ExerciseDescriptionEntity.fromObject(newExerciseDescription);
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServer();
    }
  }
  async readExercises(
    userId: string,
    name?: string
  ): Promise<ExerciseEntity[] | CustomError> {
    try {
      const exercisesList = await db
        .select({
          main: exercises,
          variant: variants,
          category: exercisesCategories,
          userId: exercises.userId,
        })
        .from(exercises)
        .leftJoin(
          exercisesCategories,
          eq(exercisesCategories.id, exercises.categoryId)
        )
        .leftJoin(
          variants,
          and(
            eq(variants.exerciseId, exercises.id),
            eq(variants.userId, userId)
          )
        )
        .where(
          and(
            or(
              name ? ilike(exercises.name, `%${name}%`) : undefined,
              name ? ilike(variants.name, `%${name}%`) : undefined
            ),
            or(isNull(exercises.userId), eq(exercises.userId, userId))
          )
        );

      return exercisesList.map((exercise) =>
        ExerciseEntity.fromObject({
          ...exercise.main,
          variant: exercise.variant,
          category: exercise.category,
          hasUser: Boolean(exercise.userId),
        })
      );
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServer();
    }
  }
  async readExercisesCategories(): Promise<
    ExerciseCategoryEntity[] | CustomError
  > {
    try {
      const exercisesCategoriesList = await db
        .select()
        .from(exercisesCategories);

      return exercisesCategoriesList.map((exerciseCategory) =>
        ExerciseCategoryEntity.fromObject(exerciseCategory)
      );
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServer();
    }
  }
  async readExercisesDescriptions(
    userId: string
  ): Promise<ExerciseDescriptionEntity[] | CustomError> {
    try {
      const exercisesDescriptionsList = await db
        .select({
          id: exercisesDescriptions.id,
          description: exercisesDescriptions.description,
        })
        .from(exercisesDescriptions)
        .where(eq(exercisesDescriptions.userId, userId));

      return exercisesDescriptionsList.map((exerciseDescription) =>
        ExerciseDescriptionEntity.fromObject(exerciseDescription)
      );
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServer();
    }
  }
  async updateVariant(
    updateVariantDto: UpdateVariantDto
  ): Promise<VariantEntity | CustomError> {
    try {
      const { name, video, userId, categoryId, image, variantId } =
        updateVariantDto;

      const [updatedVariant] = await db
        .update(variants)
        .set({
          name: name,
          video: video,
          userId: userId,
          categoryId: categoryId,
          image: image,
        })
        .where(eq(variants.id, variantId))
        .returning({
          id: variants.id,
          name: variants.name,
          video: variants.video,
          category: variants.categoryId,
          image: variants.image,
        });

      if (!updatedVariant) {
        throw CustomError.internalServer();
      }

      return VariantEntity.fromObject(updatedVariant);
    } catch (error: unknown) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw CustomError.internalServer();
    }
  }
}
